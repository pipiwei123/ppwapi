package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"one-api/common"
	"one-api/constant"

	"github.com/gin-gonic/gin"
)

func KlingRequestConvert() func(c *gin.Context) {
	return func(c *gin.Context) {
		var originalReq map[string]interface{}
		if err := common.UnmarshalBodyReusable(c, &originalReq); err != nil {
			c.Next()
			return
		}

		// 获取模型名称，支持 model_name 和 model 两种字段
		model, _ := originalReq["model_name"].(string)
		if model == "" {
			model, _ = originalReq["model"].(string)
		}
		// 如果还是空，使用默认模型
		if model == "" {
			model = "kling_video"
		}

		prompt, _ := originalReq["prompt"].(string)

		fmt.Printf("[DEBUG] KlingRequestConvert - 原始请求: %+v\n", originalReq)
		fmt.Printf("[DEBUG] KlingRequestConvert - 提取的模型: %s\n", model)
		fmt.Printf("[DEBUG] KlingRequestConvert - 提取的提示词: %s\n", prompt)

		unifiedReq := map[string]interface{}{
			"model":    model,
			"prompt":   prompt,
			"metadata": originalReq,
		}

		fmt.Printf("[DEBUG] KlingRequestConvert - 统一请求: %+v\n", unifiedReq)

		jsonData, err := json.Marshal(unifiedReq)
		if err != nil {
			c.Next()
			return
		}

		// Rewrite request body and path
		c.Request.Body = io.NopCloser(bytes.NewBuffer(jsonData))
		c.Request.URL.Path = "/v1/video/generations"
		if image, ok := originalReq["image"]; !ok || image == "" {
			c.Set("action", constant.TaskActionTextGenerate)
		}

		// We have to reset the request body for the next handlers
		c.Set(common.KeyRequestBody, jsonData)
		c.Next()
	}
}
