package middleware

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"one-api/common"
	"one-api/constant"
	"one-api/model"
)

func abortWithOpenAiMessage(c *gin.Context, statusCode int, message string) {
	userId := c.GetInt("id")
	c.JSON(statusCode, gin.H{
		"error": gin.H{
			"message": common.MessageWithRequestId(message, c.GetString(common.RequestIdKey)),
			"type":    "new_api_error",
		},
	})
	c.Abort()
	common.LogError(c.Request.Context(), fmt.Sprintf("user %d | %s", userId, message))

	// 记录错误日志到数据库（只在启用错误日志时记录）
	if constant.ErrorLogEnabled {
		tokenName := c.GetString("token_name")
		modelName := c.GetString("original_model")
		tokenId := c.GetInt("token_id")
		userGroup := c.GetString("group")
		channelId := c.GetInt("channel_id")
		channelName := c.GetString("channel_name")

		other := make(map[string]interface{})
		other["error_type"] = "middleware_error"
		other["status_code"] = statusCode
		other["channel_id"] = channelId
		other["channel_name"] = channelName
		other["channel_type"] = c.GetInt("channel_type")
		other["middleware"] = "distributor"

		model.RecordErrorLog(c, userId, channelId, modelName, tokenName, message, tokenId, 0, false, userGroup, other)
	}
}

func abortWithMidjourneyMessage(c *gin.Context, statusCode int, code int, description string) {
	c.JSON(statusCode, gin.H{
		"description": description,
		"type":        "new_api_error",
		"code":        code,
	})
	c.Abort()
	common.LogError(c.Request.Context(), description)
}
