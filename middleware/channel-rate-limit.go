package middleware

import (
	"context"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/constant"
	"one-api/dto"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	ChannelRequestRateLimitMark     = "CRRL"
	ChannelUserRequestRateLimitMark = "CURL"
)

// Redis渠道限流处理器（复用现有函数）
func redisChannelRateLimitHandler(duration int64, maxCount int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxCount <= 0 {
			c.Next()
			return
		}

		channelId, _ := common.GetContextKey(c, constant.ContextKeyChannelId)
		if channelId == nil {
			c.Next()
			return
		}

		ctx := context.Background()
		rdb := common.RDB
		key := fmt.Sprintf("channelRateLimit:%s:%d", ChannelRequestRateLimitMark, channelId.(int))

		// 复用现有的 checkRedisRateLimit 函数
		allowed, err := checkRedisRateLimit(ctx, rdb, key, maxCount, duration)
		if err != nil {
			fmt.Println("检查渠道请求数限制失败:", err.Error())
			abortWithOpenAiMessage(c, http.StatusInternalServerError, "channel_rate_limit_check_failed")
			return
		}

		if !allowed {
			abortWithOpenAiMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("请求排队中, 请稍后重试"))
			return
		}

		// 复用现有的 recordRedisRequest 函数
		recordRedisRequest(ctx, rdb, key, maxCount)
		c.Next()
	}
}

// 内存渠道限流处理器（复用现有的 inMemoryRateLimiter）
func memoryChannelRateLimitHandler(duration int64, maxCount int) gin.HandlerFunc {
	// 复用现有的 inMemoryRateLimiter
	inMemoryRateLimiter.Init(time.Duration(duration) * time.Second)

	return func(c *gin.Context) {
		if maxCount <= 0 {
			c.Next()
			return
		}

		channelId, _ := common.GetContextKey(c, constant.ContextKeyChannelId)
		if channelId == nil {
			c.Next()
			return
		}

		key := fmt.Sprintf("%s:%d", ChannelRequestRateLimitMark, channelId.(int))

		// 复用现有的 inMemoryRateLimiter.Request 方法
		if !inMemoryRateLimiter.Request(key, maxCount, duration) {
			abortWithOpenAiMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("请求排队中, 请稍后重试"))
			return
		}

		c.Next()
	}
}

// Redis渠道用户限流处理器
func redisChannelUserRateLimitHandler(duration int64, maxCount int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxCount <= 0 {
			c.Next()
			return
		}

		channelId, _ := common.GetContextKey(c, constant.ContextKeyChannelId)
		if channelId == nil {
			c.Next()
			return
		}

		userId, _ := common.GetContextKey(c, constant.ContextKeyUserId)
		if userId == nil {
			c.Next()
			return
		}

		ctx := context.Background()
		rdb := common.RDB
		key := fmt.Sprintf("channelUserRateLimit:%s:%d:%d", ChannelUserRequestRateLimitMark, channelId.(int), userId.(int))

		// 复用现有的 checkRedisRateLimit 函数
		allowed, err := checkRedisRateLimit(ctx, rdb, key, maxCount, duration)
		if err != nil {
			fmt.Println("检查渠道用户请求数限制失败:", err.Error())
			abortWithOpenAiMessage(c, http.StatusInternalServerError, "channel_user_rate_limit_check_failed")
			return
		}

		if !allowed {
			abortWithOpenAiMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("您在该渠道的请求频率过高, 请稍后重试"))
			return
		}

		// 复用现有的 recordRedisRequest 函数
		recordRedisRequest(ctx, rdb, key, maxCount)
		c.Next()
	}
}

// 内存渠道用户限流处理器
func memoryChannelUserRateLimitHandler(duration int64, maxCount int) gin.HandlerFunc {
	// 复用现有的 inMemoryRateLimiter
	inMemoryRateLimiter.Init(time.Duration(duration) * time.Second)

	return func(c *gin.Context) {
		if maxCount <= 0 {
			c.Next()
			return
		}

		channelId, _ := common.GetContextKey(c, constant.ContextKeyChannelId)
		if channelId == nil {
			c.Next()
			return
		}

		userId, _ := common.GetContextKey(c, constant.ContextKeyUserId)
		if userId == nil {
			c.Next()
			return
		}

		key := fmt.Sprintf("%s:%d:%d", ChannelUserRequestRateLimitMark, channelId.(int), userId.(int))

		// 复用现有的 inMemoryRateLimiter.Request 方法
		if !inMemoryRateLimiter.Request(key, maxCount, duration) {
			abortWithOpenAiMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("您在该渠道的请求频率过高, 请稍后重试"))
			return
		}

		c.Next()
	}
}

// ChannelRateLimit 渠道请求限流中间件
func ChannelRateLimit() func(c *gin.Context) {
	return func(c *gin.Context) {
		// 获取渠道设置
		channelSetting, ok := common.GetContextKeyType[dto.ChannelSettings](c, constant.ContextKeyChannelSetting)
		if !ok || channelSetting.RPMLimit <= 0 {
			return
		}

		// 计算限流参数（60秒窗口）
		duration := int64(60)
		maxCount := channelSetting.RPMLimit

		// 根据存储类型选择并执行限流处理器（复用现有逻辑）
		if common.RedisEnabled {
			redisChannelRateLimitHandler(duration, maxCount)(c)
		} else {
			memoryChannelRateLimitHandler(duration, maxCount)(c)
		}
	}
}

// ChannelUserRateLimit 渠道用户请求限流中间件
func ChannelUserRateLimit() func(c *gin.Context) {
	return func(c *gin.Context) {
		// 获取渠道设置
		channelSetting, ok := common.GetContextKeyType[dto.ChannelSettings](c, constant.ContextKeyChannelSetting)
		if !ok || channelSetting.UserRPMLimit <= 0 {
			return
		}

		// 计算限流参数（60秒窗口）
		duration := int64(60)
		maxCount := channelSetting.UserRPMLimit

		// 根据存储类型选择并执行限流处理器
		if common.RedisEnabled {
			redisChannelUserRateLimitHandler(duration, maxCount)(c)
		} else {
			memoryChannelUserRateLimitHandler(duration, maxCount)(c)
		}
	}
}
