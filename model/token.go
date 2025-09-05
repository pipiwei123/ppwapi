package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"one-api/common"
	"strings"

	"github.com/bytedance/gopkg/util/gopool"
	"gorm.io/gorm"
)

// TokenGroupInfo 令牌分组信息结构体
type TokenGroupInfo struct {
	IsMultiGroup         bool        `json:"is_multi_group"`          // 是否多分组模式
	MultiGroupSize       int         `json:"multi_group_size"`        // 多分组模式下的分组数量
	MultiGroupList       []string    `json:"multi_group_list"`        // 分组列表，按优先级排序
	MultiGroupStatusList map[int]int `json:"multi_group_status_list"` // 分组状态列表，group index -> status
	CurrentGroupIndex    int         `json:"current_group_index"`     // 当前使用的分组索引
}

// Value implements driver.Valuer interface
func (t TokenGroupInfo) Value() (driver.Value, error) {
	return json.Marshal(t)
}

// Scan implements sql.Scanner interface
func (t *TokenGroupInfo) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytesValue, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytesValue, t)
}

type Token struct {
	Id                 int            `json:"id"`
	UserId             int            `json:"user_id" gorm:"index"`
	Key                string         `json:"key" gorm:"type:char(48);uniqueIndex"`
	Status             int            `json:"status" gorm:"default:1"`
	Name               string         `json:"name" gorm:"index" `
	CreatedTime        int64          `json:"created_time" gorm:"bigint"`
	AccessedTime       int64          `json:"accessed_time" gorm:"bigint"`
	ExpiredTime        int64          `json:"expired_time" gorm:"bigint;default:-1"` // -1 means never expired
	RemainQuota        int            `json:"remain_quota" gorm:"default:0"`
	UnlimitedQuota     bool           `json:"unlimited_quota"`
	ModelLimitsEnabled bool           `json:"model_limits_enabled"`
	ModelLimits        string         `json:"model_limits" gorm:"type:varchar(1024);default:''"`
	AllowIps           *string        `json:"allow_ips" gorm:"default:''"`
	UsedQuota          int            `json:"used_quota" gorm:"default:0"` // used quota
	Group              string         `json:"group" gorm:"default:''"`     // 单分组模式（向后兼容）
	GroupInfo          TokenGroupInfo `json:"group_info" gorm:"type:json"` // 多分组信息
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}

func (token *Token) Clean() {
	token.Key = ""
}

// GetCurrentGroup 获取当前应该使用的分组
func (token *Token) GetCurrentGroup() string {
	// 如果不是多分组模式，返回原有的Group字段
	if !token.GroupInfo.IsMultiGroup || len(token.GroupInfo.MultiGroupList) == 0 {
		return token.Group
	}

	// 在多分组模式下，按优先级和状态获取可用分组
	for i, group := range token.GroupInfo.MultiGroupList {
		// 检查分组状态（如果状态列表中没有记录，默认为启用状态）
		if status, exists := token.GroupInfo.MultiGroupStatusList[i]; exists {
			if status != common.TokenStatusEnabled {
				continue // 跳过禁用的分组
			}
		}
		return group
	}

	// 如果所有分组都不可用，返回第一个分组
	if len(token.GroupInfo.MultiGroupList) > 0 {
		return token.GroupInfo.MultiGroupList[0]
	}

	// 最后的fallback
	return token.Group
}

// GetAllGroups 获取所有分组（按优先级排序）
func (token *Token) GetAllGroups() []string {
	if !token.GroupInfo.IsMultiGroup || len(token.GroupInfo.MultiGroupList) == 0 {
		if token.Group != "" {
			return []string{token.Group}
		}
		return []string{}
	}
	return token.GroupInfo.MultiGroupList
}

// SetMultiGroups 设置多分组模式
func (token *Token) SetMultiGroups(groups []string) {
	if len(groups) <= 1 {
		// 单分组模式
		token.GroupInfo.IsMultiGroup = false
		token.GroupInfo.MultiGroupSize = 0
		token.GroupInfo.MultiGroupList = []string{}
		token.GroupInfo.MultiGroupStatusList = make(map[int]int)
		token.GroupInfo.CurrentGroupIndex = 0
		if len(groups) == 1 {
			token.Group = groups[0]
		}
	} else {
		// 多分组模式
		token.GroupInfo.IsMultiGroup = true
		token.GroupInfo.MultiGroupSize = len(groups)
		token.GroupInfo.MultiGroupList = groups
		token.GroupInfo.MultiGroupStatusList = make(map[int]int)
		token.GroupInfo.CurrentGroupIndex = 0
		token.Group = groups[0] // 兼容性：将第一个分组设置为Group字段
	}
}

// DisableGroup 禁用指定索引的分组
func (token *Token) DisableGroup(groupIndex int) {
	if !token.GroupInfo.IsMultiGroup || groupIndex >= len(token.GroupInfo.MultiGroupList) {
		return
	}

	if token.GroupInfo.MultiGroupStatusList == nil {
		token.GroupInfo.MultiGroupStatusList = make(map[int]int)
	}
	token.GroupInfo.MultiGroupStatusList[groupIndex] = common.TokenStatusExpired // 使用过期状态表示禁用
}

// EnableGroup 启用指定索引的分组
func (token *Token) EnableGroup(groupIndex int) {
	if !token.GroupInfo.IsMultiGroup || groupIndex >= len(token.GroupInfo.MultiGroupList) {
		return
	}

	if token.GroupInfo.MultiGroupStatusList == nil {
		token.GroupInfo.MultiGroupStatusList = make(map[int]int)
	}
	delete(token.GroupInfo.MultiGroupStatusList, groupIndex) // 删除记录表示启用
}

func (token *Token) GetIpLimitsMap() map[string]any {
	// delete empty spaces
	//split with \n
	ipLimitsMap := make(map[string]any)
	if token.AllowIps == nil {
		return ipLimitsMap
	}
	cleanIps := strings.ReplaceAll(*token.AllowIps, " ", "")
	if cleanIps == "" {
		return ipLimitsMap
	}
	ips := strings.Split(cleanIps, "\n")
	for _, ip := range ips {
		ip = strings.TrimSpace(ip)
		ip = strings.ReplaceAll(ip, ",", "")
		if common.IsIP(ip) {
			ipLimitsMap[ip] = true
		}
	}
	return ipLimitsMap
}

func GetAllUserTokens(userId int, startIdx int, num int) ([]*Token, error) {
	var tokens []*Token
	var err error
	err = DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&tokens).Error
	return tokens, err
}

func SearchUserTokens(userId int, keyword string, token string) (tokens []*Token, err error) {
	if token != "" {
		token = strings.Trim(token, "sk-")
	}
	err = DB.Where("user_id = ?", userId).Where("name LIKE ?", "%"+keyword+"%").Where(commonKeyCol+" LIKE ?", "%"+token+"%").Find(&tokens).Error
	return tokens, err
}

func ValidateUserToken(key string) (token *Token, err error) {
	if key == "" {
		return nil, errors.New("未提供令牌")
	}
	token, err = GetTokenByKey(key, false)
	if err == nil {
		if token.Status == common.TokenStatusExhausted {
			keyPrefix := key[:3]
			keySuffix := key[len(key)-3:]
			return token, errors.New("该令牌额度已用尽 TokenStatusExhausted[sk-" + keyPrefix + "***" + keySuffix + "]")
		} else if token.Status == common.TokenStatusExpired {
			return token, errors.New("该令牌已过期")
		}
		if token.Status != common.TokenStatusEnabled {
			return token, errors.New("该令牌状态不可用")
		}
		if token.ExpiredTime != -1 && token.ExpiredTime < common.GetTimestamp() {
			if !common.RedisEnabled {
				token.Status = common.TokenStatusExpired
				err := token.SelectUpdate()
				if err != nil {
					common.SysError("failed to update token status" + err.Error())
				}
			}
			return token, errors.New("该令牌已过期")
		}
		if !token.UnlimitedQuota && token.RemainQuota <= 0 {
			if !common.RedisEnabled {
				// in this case, we can make sure the token is exhausted
				token.Status = common.TokenStatusExhausted
				err := token.SelectUpdate()
				if err != nil {
					common.SysError("failed to update token status" + err.Error())
				}
			}
			keyPrefix := key[:3]
			keySuffix := key[len(key)-3:]
			return token, errors.New(fmt.Sprintf("[sk-%s***%s] 该令牌额度已用尽 !token.UnlimitedQuota && token.RemainQuota = %d", keyPrefix, keySuffix, token.RemainQuota))
		}
		return token, nil
	}
	return nil, errors.New("无效的令牌")
}

func GetTokenByIds(id int, userId int) (*Token, error) {
	if id == 0 || userId == 0 {
		return nil, errors.New("id 或 userId 为空！")
	}
	token := Token{Id: id, UserId: userId}
	var err error = nil
	err = DB.First(&token, "id = ? and user_id = ?", id, userId).Error
	return &token, err
}

func GetTokenById(id int) (*Token, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}
	token := Token{Id: id}
	var err error = nil
	err = DB.First(&token, "id = ?", id).Error
	if shouldUpdateRedis(true, err) {
		gopool.Go(func() {
			if err := cacheSetToken(token); err != nil {
				common.SysError("failed to update user status cache: " + err.Error())
			}
		})
	}
	return &token, err
}

func GetTokenByKey(key string, fromDB bool) (token *Token, err error) {
	defer func() {
		// Update Redis cache asynchronously on successful DB read
		if shouldUpdateRedis(fromDB, err) && token != nil {
			gopool.Go(func() {
				if err := cacheSetToken(*token); err != nil {
					common.SysError("failed to update user status cache: " + err.Error())
				}
			})
		}
	}()
	if !fromDB && common.RedisEnabled {
		// Try Redis first
		token, err := cacheGetTokenByKey(key)
		if err == nil {
			optimizeMultiGroup(token)
			return token, nil
		}
		// Don't return error - fall through to DB
	}
	fromDB = true
	err = DB.Where(commonKeyCol+" = ?", key).First(&token).Error

	// 兼容性处理：检测旧的逗号分隔分组格式并自动转换为多分组模式
	if err == nil {
		optimizeMultiGroup(token)
	}

	return token, err
}

func (token *Token) Insert() error {
	var err error
	err = DB.Create(token).Error
	return err
}

// Update Make sure your token's fields is completed, because this will update non-zero values
func (token *Token) Update() (err error) {
	defer func() {
		if shouldUpdateRedis(true, err) {
			gopool.Go(func() {
				err := cacheSetToken(*token)
				if err != nil {
					common.SysError("failed to update token cache: " + err.Error())
				}
			})
		}
	}()
	err = DB.Model(token).Select("name", "status", "expired_time", "remain_quota", "unlimited_quota",
		"model_limits_enabled", "model_limits", "allow_ips", "group", "group_info").Updates(token).Error
	return err
}

func (token *Token) SelectUpdate() (err error) {
	defer func() {
		if shouldUpdateRedis(true, err) {
			gopool.Go(func() {
				err := cacheSetToken(*token)
				if err != nil {
					common.SysError("failed to update token cache: " + err.Error())
				}
			})
		}
	}()
	// This can update zero values
	return DB.Model(token).Select("accessed_time", "status").Updates(token).Error
}

func (token *Token) Delete() (err error) {
	defer func() {
		if shouldUpdateRedis(true, err) {
			gopool.Go(func() {
				err := cacheDeleteToken(token.Key)
				if err != nil {
					common.SysError("failed to delete token cache: " + err.Error())
				}
			})
		}
	}()
	err = DB.Delete(token).Error
	return err
}

func (token *Token) IsModelLimitsEnabled() bool {
	return token.ModelLimitsEnabled
}

func (token *Token) GetModelLimits() []string {
	if token.ModelLimits == "" {
		return []string{}
	}
	return strings.Split(token.ModelLimits, ",")
}

func (token *Token) GetModelLimitsMap() map[string]bool {
	limits := token.GetModelLimits()
	limitsMap := make(map[string]bool)
	for _, limit := range limits {
		limitsMap[limit] = true
	}
	return limitsMap
}

func DisableModelLimits(tokenId int) error {
	token, err := GetTokenById(tokenId)
	if err != nil {
		return err
	}
	token.ModelLimitsEnabled = false
	token.ModelLimits = ""
	return token.Update()
}

func DeleteTokenById(id int, userId int) (err error) {
	// Why we need userId here? In case user want to delete other's token.
	if id == 0 || userId == 0 {
		return errors.New("id 或 userId 为空！")
	}
	token := Token{Id: id, UserId: userId}
	err = DB.Where(token).First(&token).Error
	if err != nil {
		return err
	}
	return token.Delete()
}

func IncreaseTokenQuota(id int, key string, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if common.RedisEnabled {
		gopool.Go(func() {
			err := cacheIncrTokenQuota(key, int64(quota))
			if err != nil {
				common.SysError("failed to increase token quota: " + err.Error())
			}
		})
	}
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTokenQuota, id, quota)
		return nil
	}
	return increaseTokenQuota(id, quota)
}

func increaseTokenQuota(id int, quota int) (err error) {
	err = DB.Model(&Token{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"remain_quota":  gorm.Expr("remain_quota + ?", quota),
			"used_quota":    gorm.Expr("used_quota - ?", quota),
			"accessed_time": common.GetTimestamp(),
		},
	).Error
	return err
}

func DecreaseTokenQuota(id int, key string, quota int) (err error) {
	if quota < 0 {
		return errors.New("quota 不能为负数！")
	}
	if common.RedisEnabled {
		gopool.Go(func() {
			err := cacheDecrTokenQuota(key, int64(quota))
			if err != nil {
				common.SysError("failed to decrease token quota: " + err.Error())
			}
		})
	}
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTokenQuota, id, -quota)
		return nil
	}
	return decreaseTokenQuota(id, quota)
}

func decreaseTokenQuota(id int, quota int) (err error) {
	err = DB.Model(&Token{}).Where("id = ?", id).Updates(
		map[string]interface{}{
			"remain_quota":  gorm.Expr("remain_quota - ?", quota),
			"used_quota":    gorm.Expr("used_quota + ?", quota),
			"accessed_time": common.GetTimestamp(),
		},
	).Error
	return err
}

// CountUserTokens returns total number of tokens for the given user, used for pagination
func CountUserTokens(userId int) (int64, error) {
	var total int64
	err := DB.Model(&Token{}).Where("user_id = ?", userId).Count(&total).Error
	return total, err
}

// BatchDeleteTokens 删除指定用户的一组令牌，返回成功删除数量
func BatchDeleteTokens(ids []int, userId int) (int, error) {
	if len(ids) == 0 {
		return 0, errors.New("ids 不能为空！")
	}

	tx := DB.Begin()

	var tokens []Token
	if err := tx.Where("user_id = ? AND id IN (?)", userId, ids).Find(&tokens).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Where("user_id = ? AND id IN (?)", userId, ids).Delete(&Token{}).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	if common.RedisEnabled {
		gopool.Go(func() {
			for _, t := range tokens {
				_ = cacheDeleteToken(t.Key)
			}
		})
	}

	return len(tokens), nil
}

func optimizeMultiGroup(token *Token) {
	if token != nil && strings.Contains(token.Group, ",") && !token.GroupInfo.IsMultiGroup {
		groups := strings.Split(token.Group, ",")
		var cleanedGroups []string
		for _, g := range groups {
			g = strings.TrimSpace(g)
			if g != "" {
				cleanedGroups = append(cleanedGroups, g)
			}
		}
		if len(cleanedGroups) > 1 {
			// 自动转换为多分组模式
			token.SetMultiGroups(cleanedGroups)
			// 异步更新到数据库
			gopool.Go(func() {
				if updateErr := token.Update(); updateErr != nil {
					common.SysError("failed to auto-migrate token to multi-group: " + updateErr.Error())
				}
			})
		}
	}
}
