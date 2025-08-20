package setting

import (
	"encoding/json"
	"one-api/common"
	"sort"
	"sync"
)

// GroupInfo 分组信息结构体
type GroupInfo struct {
	Description string `json:"description"`
	Priority    int    `json:"priority"` // 优先级，数字越小优先级越高
}

// GroupWithName 带名称的分组信息，用于排序
type GroupWithName struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Priority    int    `json:"priority"`
}

var userUsableGroups = map[string]GroupInfo{
	"default": {Description: "默认分组", Priority: 10},
	"vip":     {Description: "VIP分组", Priority: 5},
}
var userUsableGroupsMutex sync.RWMutex

func GetUserUsableGroupsCopy() map[string]string {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	copyUserUsableGroups := make(map[string]string)
	for k, v := range userUsableGroups {
		copyUserUsableGroups[k] = v.Description
	}
	return copyUserUsableGroups
}

// GetUserUsableGroupsInfo 获取分组信息副本
func GetUserUsableGroupsInfo() map[string]GroupInfo {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	copyUserUsableGroups := make(map[string]GroupInfo)
	for k, v := range userUsableGroups {
		copyUserUsableGroups[k] = v
	}
	return copyUserUsableGroups
}

// GetSortedUserUsableGroups 获取按优先级排序的分组列表
func GetSortedUserUsableGroups(userGroup string) []GroupWithName {
	groupsInfo := GetUserUsableGroupsInfo()

	var groups []GroupWithName
	for name, info := range groupsInfo {
		groups = append(groups, GroupWithName{
			Name:        name,
			Description: info.Description,
			Priority:    info.Priority,
		})
	}

	// 如果userGroup不在列表中，添加它
	if userGroup != "" {
		found := false
		for _, g := range groups {
			if g.Name == userGroup {
				found = true
				break
			}
		}
		if !found {
			groups = append(groups, GroupWithName{
				Name:        userGroup,
				Description: "用户分组",
				Priority:    999, // 用户自定义分组优先级较低
			})
		}
	}

	// 确保default分组存在
	foundDefault := false
	for _, g := range groups {
		if g.Name == "default" {
			foundDefault = true
			break
		}
	}
	if !foundDefault {
		groups = append(groups, GroupWithName{
			Name:        "default",
			Description: "默认分组",
			Priority:    10,
		})
	}

	// 按优先级排序（数字越小优先级越高）
	sort.Slice(groups, func(i, j int) bool {
		return groups[i].Priority < groups[j].Priority
	})

	return groups
}

func UserUsableGroups2JSONString() string {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	jsonBytes, err := json.Marshal(userUsableGroups)
	if err != nil {
		common.SysError("error marshalling user groups: " + err.Error())
	}
	return string(jsonBytes)
}

func UpdateUserUsableGroupsByJSONString(jsonStr string) error {
	userUsableGroupsMutex.Lock()
	defer userUsableGroupsMutex.Unlock()

	// 尝试解析新格式（带优先级）
	newUserUsableGroups := make(map[string]GroupInfo)
	err := json.Unmarshal([]byte(jsonStr), &newUserUsableGroups)
	if err == nil {
		userUsableGroups = newUserUsableGroups
		return nil
	}

	// 兼容旧格式（只有描述）
	oldUserUsableGroups := make(map[string]string)
	err = json.Unmarshal([]byte(jsonStr), &oldUserUsableGroups)
	if err != nil {
		return err
	}

	// 转换为新格式，使用默认优先级
	userUsableGroups = make(map[string]GroupInfo)
	priority := 10 // 默认优先级
	for name, desc := range oldUserUsableGroups {
		userUsableGroups[name] = GroupInfo{
			Description: desc,
			Priority:    priority,
		}
		priority += 10 // 递增优先级
	}

	return nil
}

func GetUserUsableGroups(userGroup string) map[string]string {
	groupsCopy := GetUserUsableGroupsCopy()
	if userGroup == "" {
		if _, ok := groupsCopy["default"]; !ok {
			groupsCopy["default"] = "default"
		}
	}
	// 如果userGroup不在UserUsableGroups中，返回UserUsableGroups + userGroup
	if _, ok := groupsCopy[userGroup]; !ok {
		groupsCopy[userGroup] = "用户分组"
	}
	// 如果userGroup在UserUsableGroups中，返回UserUsableGroups
	return groupsCopy
}

func GroupInUserUsableGroups(groupName string) bool {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	_, ok := userUsableGroups[groupName]
	return ok
}

func GetUsableGroupDescription(groupName string) string {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	if info, ok := userUsableGroups[groupName]; ok {
		return info.Description
	}
	return groupName
}

// GetGroupPriority 获取分组优先级
func GetGroupPriority(groupName string) int {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	if info, ok := userUsableGroups[groupName]; ok {
		return info.Priority
	}
	return 999 // 默认较低优先级
}

// SetGroupPriority 设置分组优先级
func SetGroupPriority(groupName string, priority int) {
	userUsableGroupsMutex.Lock()
	defer userUsableGroupsMutex.Unlock()

	if info, ok := userUsableGroups[groupName]; ok {
		info.Priority = priority
		userUsableGroups[groupName] = info
	}
}
