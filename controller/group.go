package controller

import (
	"net/http"
	"one-api/model"
	"one-api/setting"
	"one-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

func GetGroups(c *gin.Context) {
	groupNames := make([]string, 0)
	for groupName := range ratio_setting.GetGroupRatioCopy() {
		groupNames = append(groupNames, groupName)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    groupNames,
	})
}

func GetUserGroups(c *gin.Context) {
	userId := c.GetInt("id")
	userGroup, _ := model.GetUserGroup(userId, false)

	// 获取按优先级排序的分组列表
	sortedGroups := setting.GetSortedUserUsableGroups(userGroup)
	groupRatios := ratio_setting.GetGroupRatioCopy()

	// 构建最终的分组列表
	var usableGroups []map[string]interface{}

	// 添加auto分组（如果启用）
	if setting.GroupInUserUsableGroups("auto") {
		usableGroups = append(usableGroups, map[string]interface{}{
			"name":     "auto",
			"ratio":    "自动",
			"desc":     setting.GetUsableGroupDescription("auto"),
			"priority": 0, // auto分组优先级最高
		})
	}

	// 添加其他分组
	for _, group := range sortedGroups {
		// 检查分组是否在比率配置中存在
		if ratio, ok := groupRatios[group.Name]; ok {
			usableGroups = append(usableGroups, map[string]interface{}{
				"name":     group.Name,
				"ratio":    ratio,
				"desc":     group.Description,
				"priority": group.Priority,
			})
		} else if group.Name == userGroup {
			// 如果是用户分组但不在比率配置中，仍然包含它
			usableGroups = append(usableGroups, map[string]interface{}{
				"name":     group.Name,
				"ratio":    1.0, // 默认比率
				"desc":     group.Description,
				"priority": group.Priority,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    usableGroups,
	})
}
