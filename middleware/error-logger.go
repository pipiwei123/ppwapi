package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"one-api/constant"
	"one-api/model"

	"github.com/gin-gonic/gin"
)

// responseBodyWriter 包装 gin.ResponseWriter 以捕获响应内容，但不影响正常返回
type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseBodyWriter) Write(data []byte) (int, error) {
	// 检查当前状态码，只有错误时才缓存
	if w.Status() >= 400 {
		w.body.Write(data)
	}
	return w.ResponseWriter.Write(data)
}

// ErrorLogMiddleware 错误日志记录中间件
func ErrorLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否启用了错误日志中间件
		if !constant.ErrorLogMiddlewareEnable {
			c.Next()
			return
		}

		// 读取请求体以获取参数（用于错误日志）
		var requestBody []byte
		var requestParams map[string]interface{}

		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// 恢复请求体供后续处理使用
			c.Request.Body = io.NopCloser(bytes.NewReader(requestBody))

			// 尝试解析JSON请求参数
			if len(requestBody) > 0 {
				json.Unmarshal(requestBody, &requestParams)
			}
		}

		// 包装响应Writer以捕获响应内容
		responseBody := &bytes.Buffer{}
		wrappedWriter := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           responseBody,
		}
		c.Writer = wrappedWriter

		// 继续处理请求
		c.Next()

		// 检查是否有错误发生
		statusCode := c.Writer.Status()
		if statusCode >= 400 {
			// 获取请求相关信息
			userId := c.GetInt("id")

			// 如果userId为0，说明认证失败，不记录错误日志
			if userId == 0 {
				return
			}

			tokenName := c.GetString("token_name")
			modelName := c.GetString("original_model")
			tokenId := c.GetInt("token_id")
			userGroup := c.GetString("group")
			channelId := c.GetInt("channel_id")

			// 构建错误内容
			errorContent := ""

			// 尝试从响应body中提取具体错误信息
			responseBodyStr := responseBody.String()
			if responseBodyStr != "" {
				if extractedError := extractErrorFromResponse(responseBodyStr); extractedError != "" {
					errorContent += extractedError
				}
			}

			// 构建其他信息
			other := make(map[string]interface{})
			other["error_type"] = "middleware_error"
			other["status_code"] = statusCode
			other["channel_id"] = channelId
			other["channel_name"] = c.GetString("channel_name")
			other["channel_type"] = c.GetInt("channel_type")
			other["middleware"] = "error_logger"
			other["request_method"] = c.Request.Method
			other["request_path"] = c.Request.URL.Path
			if c.Request.URL.RawQuery != "" {
				other["request_query"] = c.Request.URL.RawQuery
			}
			if requestParams != nil {
				other["request_params"] = requestParams
			}

			// 增加一些令牌相关的调试信息

			// 添加错误响应内容
			if responseBodyStr != "" {
				// 尝试解析响应为JSON
				var responseData map[string]interface{}
				if json.Unmarshal([]byte(responseBodyStr), &responseData) == nil {
					other["error_response"] = responseData
				} else {
					// 如果不是JSON，直接存储字符串
					other["error_response"] = responseBodyStr
				}
			}

			// 记录错误日志
			model.RecordErrorLog(c, userId, channelId, modelName, tokenName, errorContent, tokenId, 0, false, userGroup, other)
		}
	}
}

// extractErrorFromResponse 从响应body中提取error.message
func extractErrorFromResponse(responseBody string) string {
	var responseData map[string]interface{}
	if json.Unmarshal([]byte(responseBody), &responseData) != nil {
		return ""
	}

	// 提取 error.message
	if errorObj, exists := responseData["error"]; exists {
		if errorMap, ok := errorObj.(map[string]interface{}); ok {
			if message, exists := errorMap["message"]; exists {
				if messageStr, ok := message.(string); ok {
					return messageStr
				}
			}
		}
	}

	return ""
}
