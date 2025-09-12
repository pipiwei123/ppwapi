package model

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"one-api/common"
)

// ChannelModelTimeout 渠道超时配置
type ChannelModelTimeout struct {
	Enable                  bool  `json:"enable"`
	TimeWindow              int   `json:"timeout_window"`
	TimeoutFRTTimeThreshold int64 `json:"timeout_frt_time_ms"` // 毫秒
	TimeoutUseTimeThreshold int   `json:"timeout_use_time"`
	DisableRecoveryTime     int   `json:"disable_recovery_time"`
}

// ChannelTimeoutConfig 多渠道超时配置结构
type ChannelTimeoutConfig map[string]map[string]ChannelModelTimeout // modelName -> channelId -> config

// IntervalStats 每10秒间隔统计数据
type IntervalStats struct {
	Timestamp    time.Time // 10秒间隔时间戳
	TotalCount   int64     // 总请求次数（用于UseTime统计）
	FRTCount     int64     // 有效FRT次数（负数FRT不计入）
	TotalFRT     int64     // 总FRT时间(毫秒)
	TotalUseTime int64     // 总use_time(秒)
}

// ChannelTimeoutMonitor 渠道超时监控
type ChannelTimeoutMonitor struct {
	ChannelId       int
	ModelName       string          // 模型名称
	Stats           []IntervalStats // 滑动窗口，最多30个元素(5分钟)
	CurrentInterval time.Time       // 当前统计10秒间隔
	mu              sync.RWMutex
	LastDisabled    time.Time // 上次被禁用的时间
}

// DisabledChannelInfo 临时禁用的渠道信息
type DisabledChannelInfo struct {
	ChannelId    int
	ModelName    string // 模型名称
	DisabledTime time.Time
	Reason       string
	Duration     time.Duration // 禁用时长
}

// 全局监控管理
var (
	channelMonitors  sync.Map // map[channelId:modelName]*ChannelTimeoutMonitor
	disabledChannels sync.Map // map[channelId:modelName]*DisabledChannelInfo

	// 多渠道超时配置
	globalMultiChannelConfig *ChannelTimeoutConfig
	timeoutConfigMu          sync.RWMutex
)

// getMonitorKey 生成监控器的键
func getMonitorKey(channelId int, modelName string) string {
	return fmt.Sprintf("%d:%s", channelId, modelName)
}

// updateTimeoutConfig 更新多渠道超时配置
func updateTimeoutConfig() {
	timeoutConfigMu.Lock()
	defer timeoutConfigMu.Unlock()

	if common.ChannelTimeoutControl != "" {
		var multiChannelConfig ChannelTimeoutConfig
		if err := json.Unmarshal([]byte(common.ChannelTimeoutControl), &multiChannelConfig); err == nil {
			globalMultiChannelConfig = &multiChannelConfig
		} else {
			common.SysError(fmt.Sprintf("解析超时配置失败: %v", err))
			globalMultiChannelConfig = nil
		}
	} else {
		globalMultiChannelConfig = nil
	}
}

// getChannelTimeoutConfig 根据渠道ID和模型名称获取特定的超时配置
func getChannelTimeoutConfig(channelId int, modelName string) *ChannelModelTimeout {
	timeoutConfigMu.RLock()
	defer timeoutConfigMu.RUnlock()

	// 如果有新格式的多渠道配置，优先使用
	if globalMultiChannelConfig != nil {
		// 直接使用模型名称作为配置键
		if modelConfig, ok := (*globalMultiChannelConfig)[modelName]; ok {
			channelIdStr := fmt.Sprintf("%d", channelId)
			if config, ok := modelConfig[channelIdStr]; ok {
				// 返回配置的副本以避免并发问题
				configCopy := config
				return &configCopy
			}
		}
	}

	// 如果没有找到特定配置，返回 nil（不进行超时监控）
	return nil
}

// AddRequest 添加一次请求记录
func (m *ChannelTimeoutMonitor) AddRequest(frtMs int64, useTimeSeconds int, channel *ChannelModelTimeout) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	// 截断到10秒间隔
	second10 := now.Truncate(10 * time.Second)

	// 如果是新的10秒间隔，滑动窗口
	if second10.After(m.CurrentInterval) {
		m.slideWindow(second10, channel.TimeWindow)
		m.CurrentInterval = second10
	}

	// 更新当前10秒间隔统计
	if len(m.Stats) > 0 {
		current := &m.Stats[len(m.Stats)-1]
		current.TotalCount++
		current.TotalUseTime += int64(useTimeSeconds)

		// 只有当FRT为非负数时才统计
		if frtMs >= 0 {
			current.FRTCount++
			current.TotalFRT += frtMs
		}
	}
}

// slideWindow 滑动窗口管理
func (m *ChannelTimeoutMonitor) slideWindow(newInterval time.Time, windowSeconds int) {
	maxIntervals := (windowSeconds + 9) / 10 // 向上取整到10秒间隔数
	if maxIntervals > 30 {                   // 限制最多30个10秒间隔(5分钟)
		maxIntervals = 30
	}

	// 创建新的统计条目
	newStat := IntervalStats{
		Timestamp: newInterval,
	}

	// 如果还没有统计或者是第一次
	if len(m.Stats) == 0 {
		m.Stats = append(m.Stats, newStat)
		return
	}

	// 滑动窗口：移除过期数据，添加新数据
	cutoff := newInterval.Add(-time.Duration(windowSeconds) * time.Second)

	// 过滤保留有效数据
	validStats := make([]IntervalStats, 0, maxIntervals)
	for _, stat := range m.Stats {
		if stat.Timestamp.After(cutoff) {
			validStats = append(validStats, stat)
		}
	}

	// 添加新统计
	validStats = append(validStats, newStat)

	// 如果超过最大长度，移除最旧的
	if len(validStats) > maxIntervals {
		validStats = validStats[len(validStats)-maxIntervals:]
	}

	m.Stats = validStats
}

// GetWindowStats 获取时间窗口内的统计信息
func (m *ChannelTimeoutMonitor) GetWindowStats() (totalRequests, totalFRTCount, totalFRT, totalUseTime int64, avgFRT, avgUseTime float64) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, stat := range m.Stats {
		totalRequests += stat.TotalCount
		totalFRTCount += stat.FRTCount
		totalFRT += stat.TotalFRT
		totalUseTime += stat.TotalUseTime
	}

	if totalFRTCount > 0 {
		avgFRT = float64(totalFRT) / float64(totalFRTCount)
	}

	if totalRequests > 0 {
		avgUseTime = float64(totalUseTime) / float64(totalRequests)
	}

	return
}

// GetCompletedWindowStats 获取已完成区间的统计信息（排除当前正在进行的区间）
func (m *ChannelTimeoutMonitor) GetCompletedWindowStats() (totalRequests, totalFRTCount, totalFRT, totalUseTime int64, avgFRT, avgUseTime float64) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	now := time.Now()
	currentInterval := now.Truncate(10 * time.Second)

	// 遍历所有统计，但排除当前正在进行的区间
	for _, stat := range m.Stats {
		// 跳过当前正在进行的区间
		if stat.Timestamp.Equal(currentInterval) {
			continue
		}

		totalRequests += stat.TotalCount
		totalFRTCount += stat.FRTCount
		totalFRT += stat.TotalFRT
		totalUseTime += stat.TotalUseTime
	}

	if totalFRTCount > 0 {
		avgFRT = float64(totalFRT) / float64(totalFRTCount)
	}

	if totalRequests > 0 {
		avgUseTime = float64(totalUseTime) / float64(totalRequests)
	}

	return
}

// RecordTimeoutStats 记录超时统计（导出函数，供其他包调用）
func RecordTimeoutStats(channelId int, modelName string, frtMs int64, useTimeSeconds int) {
	// 获取针对该渠道的超时配置
	config := getChannelTimeoutConfig(channelId, modelName)
	if config == nil || !config.Enable {
		return
	}

	// 生成组合键
	key := getMonitorKey(channelId, modelName)

	// 获取或创建监控器
	value, _ := channelMonitors.LoadOrStore(key, &ChannelTimeoutMonitor{
		ChannelId: channelId,
		ModelName: modelName,
		Stats:     make([]IntervalStats, 0, 10),
	})
	monitor := value.(*ChannelTimeoutMonitor)

	// 添加请求记录
	monitor.AddRequest(frtMs, useTimeSeconds, config)
}

// scanAndDisableTimeoutChannels 扫描所有监控器并禁用超时的渠道
func scanAndDisableTimeoutChannels() {
	// 检查是否有任何渠道启用了超时监控
	hasEnabledConfig := false
	timeoutConfigMu.RLock()
	if globalMultiChannelConfig != nil {
		for _, providerConfig := range *globalMultiChannelConfig {
			for _, channelConfig := range providerConfig {
				if channelConfig.Enable {
					hasEnabledConfig = true
					break
				}
			}
			if hasEnabledConfig {
				break
			}
		}
	}
	timeoutConfigMu.RUnlock()

	if !hasEnabledConfig {
		return
	}

	disabledCount := 0
	channelMonitors.Range(func(key, value interface{}) bool {
		monitor := value.(*ChannelTimeoutMonitor)

		// 检查是否有足够的数据进行判断
		monitor.mu.RLock()
		hasValidData := len(monitor.Stats) > 0 && !monitor.CurrentInterval.IsZero()

		// 获取该渠道的特定配置
		channelConfig := getChannelTimeoutConfig(monitor.ChannelId, monitor.ModelName)
		if channelConfig == nil || !channelConfig.Enable {
			monitor.mu.RUnlock()
			return true // 该渠道未启用超时监控，继续下一个
		}

		// 检查恢复冷却期
		if !monitor.LastDisabled.IsZero() {
			cooldown := time.Duration(channelConfig.DisableRecoveryTime) * time.Second
			if time.Since(monitor.LastDisabled) < cooldown {
				monitor.mu.RUnlock()
				return true // 继续下一个
			}
		}
		monitor.mu.RUnlock()

		if !hasValidData {
			return true // 继续下一个
		}

		// 检查是否需要禁用
		totalRequests, totalFRTCount, _, _, avgFRT, avgUseTime := monitor.GetCompletedWindowStats()
		if totalRequests == 0 {
			return true // 继续下一个
		}

		shouldDisable := false
		reason := ""

		// 只有当有有效FRT数据时才检查FRT阈值
		if totalFRTCount > 0 && avgFRT > float64(channelConfig.TimeoutFRTTimeThreshold) {
			// 平均FRT过长
			reason = fmt.Sprintf("平均FRT过长: %.0fms，超过阈值%dms", avgFRT, channelConfig.TimeoutFRTTimeThreshold)
			shouldDisable = true
		} else if avgUseTime > float64(channelConfig.TimeoutUseTimeThreshold) {
			// 平均use_time过长
			reason = fmt.Sprintf("平均use_time过长: %.2fs，超过阈值%ds", avgUseTime, channelConfig.TimeoutUseTimeThreshold)
			shouldDisable = true
		}

		if shouldDisable {
			// 添加到临时禁用列表
			keyStr := key.(string)
			disabledInfo := &DisabledChannelInfo{
				ChannelId:    monitor.ChannelId,
				ModelName:    monitor.ModelName,
				DisabledTime: time.Now(),
				Reason:       reason,
				Duration:     time.Duration(channelConfig.DisableRecoveryTime) * time.Second,
			}
			disabledChannels.Store(keyStr, disabledInfo)

			// 记录禁用时间并清除统计
			monitor.mu.Lock()
			monitor.LastDisabled = time.Now()
			monitor.Stats = make([]IntervalStats, 0, 10)
			monitor.mu.Unlock()

			disabledCount++
			RecordLog(0, LogTypeSystem, fmt.Sprintf("渠道 #%d 的模型 %s 因响应超时被临时禁用: %s (恢复时间: %v)", monitor.ChannelId, monitor.ModelName, reason, disabledInfo.Duration))
			common.SysLog(fmt.Sprintf("渠道 #%d 的模型 %s 因响应超时被临时禁用: %s (恢复时间: %v)", monitor.ChannelId, monitor.ModelName, reason, disabledInfo.Duration))
		}

		return true // 继续下一个
	})

	if disabledCount > 0 {
		common.SysLog(fmt.Sprintf("本次扫描共禁用了 %d 个渠道+模型组合", disabledCount))
	}
}

// startTimeoutScanner 启动超时扫描器
func startTimeoutScanner() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		scanAndDisableTimeoutChannels()
	}
}

// InitTimeoutMonitor 初始化超时监控系统
func InitTimeoutMonitor() {
	// 首次加载配置
	updateTimeoutConfig()

	// 启动配置更新 goroutine，每分钟检查一次配置更新
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			updateTimeoutConfig()
		}
	}()

	// 启动超时扫描器，每分钟扫描一次是否有需要禁用的渠道
	go startTimeoutScanner()

	// 启动清理器，每10分钟清理一次无活动的监控器
	go startMonitorCleaner()

	// 启动恢复检查器，每分钟检查一次过期的禁用
	go startRecoveryChecker()

	common.SysLog("渠道超时监控系统已启动")
}

// startMonitorCleaner 启动监控器清理器
func startMonitorCleaner() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		cleanInactiveMonitors()
	}
}

// cleanInactiveMonitors 清理无活动的监控器
func cleanInactiveMonitors() {
	cutoff := time.Now().Add(-15 * time.Minute) // 15分钟无活动后清理
	cleanedCount := 0

	channelMonitors.Range(func(key, value interface{}) bool {
		monitor := value.(*ChannelTimeoutMonitor)
		monitor.mu.RLock()

		inactive := len(monitor.Stats) == 0 ||
			(len(monitor.Stats) > 0 && monitor.Stats[len(monitor.Stats)-1].Timestamp.Before(cutoff))

		monitor.mu.RUnlock()

		if inactive {
			channelMonitors.Delete(key)
			cleanedCount++
		}

		return true
	})

	if cleanedCount > 0 {
		common.SysLog(fmt.Sprintf("清理了 %d 个无活动的渠道监控器", cleanedCount))
	}
}

// IsChannelTempDisabled 检查渠道+模型是否临时禁用
func IsChannelTempDisabled(channelId int, modelName string) bool {
	// 检查该渠道是否启用了超时监控
	config := getChannelTimeoutConfig(channelId, modelName)
	if config == nil || !config.Enable {
		return false
	}

	key := getMonitorKey(channelId, modelName)
	value, ok := disabledChannels.Load(key)
	if !ok {
		return false
	}

	info := value.(*DisabledChannelInfo)
	// 检查是否已经过期
	if time.Since(info.DisabledTime) >= info.Duration {
		// 已过期，移除并返回false
		disabledChannels.Delete(key)
		common.SysLog(fmt.Sprintf("渠道 #%d 的模型 %s 临时禁用已过期，恢复可用", channelId, modelName))
		RecordLog(0, LogTypeSystem, fmt.Sprintf("渠道 #%d 的模型 %s 临时禁用已过期，恢复可用", channelId, modelName))
		return false
	}

	return true
}

// startRecoveryChecker 启动恢复检查器
func startRecoveryChecker() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		checkExpiredDisabledChannels()
	}
}

// checkExpiredDisabledChannels 检查并移除过期的禁用渠道
func checkExpiredDisabledChannels() {
	expiredCount := 0

	disabledChannels.Range(func(key, value interface{}) bool {
		info := value.(*DisabledChannelInfo)
		if time.Since(info.DisabledTime) >= info.Duration {
			disabledChannels.Delete(key)
			expiredCount++
			common.SysLog(fmt.Sprintf("渠道 #%d 的模型 %s 临时禁用已过期，自动恢复可用", info.ChannelId, info.ModelName))
			RecordLog(0, LogTypeSystem, fmt.Sprintf("渠道 #%d 的模型 %s 临时禁用已过期，恢复可用", info.ChannelId, info.ModelName))
		}
		return true
	})

	if expiredCount > 0 {
		common.SysLog(fmt.Sprintf("自动恢复了 %d 个过期禁用的渠道+模型组合", expiredCount))
	}
}
