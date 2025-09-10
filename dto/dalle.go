package dto

import "encoding/json"

type ImageRequest struct {
	Model          string          `json:"model"`
	Prompt         string          `json:"prompt" binding:"required"`
	N              int             `json:"n,omitempty"`
	Size           string          `json:"size,omitempty"`
	Quality        string          `json:"quality,omitempty"`
	ResponseFormat string          `json:"response_format,omitempty"`
	Style          string          `json:"style,omitempty"`
	User           string          `json:"user,omitempty"`
	ExtraFields    json.RawMessage `json:"extra_fields,omitempty"`
	Background     string          `json:"background,omitempty"`
	Moderation     string          `json:"moderation,omitempty"`
	OutputFormat   string          `json:"output_format,omitempty"`
	Watermark      *bool           `json:"watermark,omitempty"`
	// 新增参数支持更多图像生成模型
	AspectRatio      string `json:"aspect_ratio,omitempty"`      // 长宽比，如 "1:1", "16:9", "4:3"
	Seed             *int   `json:"seed,omitempty"`              // 随机种子，用于可重现的生成
	WebhookUrl       string `json:"webhook_url,omitempty"`       // Webhook回调URL
	WebhookSecret    string `json:"webhook_secret,omitempty"`    // Webhook密钥
	PromptUpsampling *bool  `json:"prompt_upsampling,omitempty"` // 是否启用提示词优化
	SafetyTolerance  *int   `json:"safety_tolerance,omitempty"`  // 安全容忍度 0-6
	Image            string `json:"image,omitempty"`
}

type ImageResponse struct {
	Data    []ImageData `json:"data"`
	Created int64       `json:"created"`
}
type ImageData struct {
	Url           string `json:"url"`
	B64Json       string `json:"b64_json"`
	RevisedPrompt string `json:"revised_prompt"`
}
