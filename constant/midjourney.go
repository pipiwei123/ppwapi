package constant

import "strings"

const (
	MjErrorUnknown = 5
	MjRequestError = 4
)

const (
	MjActionImagine       = "IMAGINE"
	MjActionDescribe      = "DESCRIBE"
	MjActionBlend         = "BLEND"
	MjActionUpscale       = "UPSCALE"
	MjActionVariation     = "VARIATION"
	MjActionReRoll        = "REROLL"
	MjActionInPaint       = "INPAINT"
	MjActionModal         = "MODAL"
	MjActionZoom          = "ZOOM"
	MjActionCustomZoom    = "CUSTOM_ZOOM"
	MjActionShorten       = "SHORTEN"
	MjActionHighVariation = "HIGH_VARIATION"
	MjActionLowVariation  = "LOW_VARIATION"
	MjActionPan           = "PAN"
	MjActionSwapFace      = "SWAP_FACE"
	MjActionUpload        = "UPLOAD"
	MjActionVideo         = "VIDEO"
	MjActionEdits         = "EDITS"
)

var MidjourneyModel2Action = map[string]string{
	// 标准动作模型
	"mj_imagine":        MjActionImagine,
	"mj_describe":       MjActionDescribe,
	"mj_blend":          MjActionBlend,
	"mj_upscale":        MjActionUpscale,
	"mj_variation":      MjActionVariation,
	"mj_reroll":         MjActionReRoll,
	"mj_modal":          MjActionModal,
	"mj_inpaint":        MjActionInPaint,
	"mj_zoom":           MjActionZoom,
	"mj_custom_zoom":    MjActionCustomZoom,
	"mj_shorten":        MjActionShorten,
	"mj_high_variation": MjActionHighVariation,
	"mj_low_variation":  MjActionLowVariation,
	"mj_pan":            MjActionPan,
	"swap_face":         MjActionSwapFace,
	"mj_upload":         MjActionUpload,
	"mj_video":          MjActionVideo,
	"mj_edits":          MjActionEdits,
	
	// 快速模式动作模型
	"mj_fast_imagine":        MjActionImagine,
	"mj_fast_describe":       MjActionDescribe,
	"mj_fast_blend":          MjActionBlend,
	"mj_fast_upscale":        MjActionUpscale,
	"mj_fast_variation":      MjActionVariation,
	"mj_fast_reroll":         MjActionReRoll,
	"mj_fast_modal":          MjActionModal,
	"mj_fast_inpaint":        MjActionInPaint,
	"mj_fast_zoom":           MjActionZoom,
	"mj_fast_custom_zoom":    MjActionCustomZoom,
	"mj_fast_shorten":        MjActionShorten,
	"mj_fast_high_variation": MjActionHighVariation,
	"mj_fast_low_variation":  MjActionLowVariation,
	"mj_fast_pan":            MjActionPan,
	"mj_fast_swap_face":      MjActionSwapFace,
	"mj_fast_upload":         MjActionUpload,
	"mj_fast_video":          MjActionVideo,
	"mj_fast_edits":          MjActionEdits,
	
	// 慢速模式动作模型
	"mj_relax_imagine":        MjActionImagine,
	"mj_relax_describe":       MjActionDescribe,
	"mj_relax_blend":          MjActionBlend,
	"mj_relax_upscale":        MjActionUpscale,
	"mj_relax_variation":      MjActionVariation,
	"mj_relax_reroll":         MjActionReRoll,
	"mj_relax_modal":          MjActionModal,
	"mj_relax_inpaint":        MjActionInPaint,
	"mj_relax_zoom":           MjActionZoom,
	"mj_relax_custom_zoom":    MjActionCustomZoom,
	"mj_relax_shorten":        MjActionShorten,
	"mj_relax_high_variation": MjActionHighVariation,
	"mj_relax_low_variation":  MjActionLowVariation,
	"mj_relax_pan":            MjActionPan,
	"mj_relax_swap_face":      MjActionSwapFace,
	"mj_relax_upload":         MjActionUpload,
	"mj_relax_video":          MjActionVideo,
	"mj_relax_edits":          MjActionEdits,
	
	// 超快模式动作模型
	"mj_turbo_imagine":        MjActionImagine,
	"mj_turbo_describe":       MjActionDescribe,
	"mj_turbo_blend":          MjActionBlend,
	"mj_turbo_upscale":        MjActionUpscale,
	"mj_turbo_variation":      MjActionVariation,
	"mj_turbo_reroll":         MjActionReRoll,
	"mj_turbo_modal":          MjActionModal,
	"mj_turbo_inpaint":        MjActionInPaint,
	"mj_turbo_zoom":           MjActionZoom,
	"mj_turbo_custom_zoom":    MjActionCustomZoom,
	"mj_turbo_shorten":        MjActionShorten,
	"mj_turbo_high_variation": MjActionHighVariation,
	"mj_turbo_low_variation":  MjActionLowVariation,
	"mj_turbo_pan":            MjActionPan,
	"mj_turbo_swap_face":      MjActionSwapFace,
	"mj_turbo_upload":         MjActionUpload,
	"mj_turbo_video":          MjActionVideo,
	"mj_turbo_edits":          MjActionEdits,
	
	// 兼容旧版本的模式映射模型
	"mj-relax": MjActionImagine,
	"mj-fast":  MjActionImagine,
	"mj-turbo": MjActionImagine,
}

// 模型名称到模式的映射
var MidjourneyModel2Mode = map[string]string{
	// 兼容旧版本模式映射
	"mj-relax": "relax",
	"mj-fast":  "fast",
	"mj-turbo": "turbo",
	
	// 快速模式动作模型映射
	"mj_fast_imagine":        "fast",
	"mj_fast_describe":       "fast",
	"mj_fast_blend":          "fast",
	"mj_fast_upscale":        "fast",
	"mj_fast_variation":      "fast",
	"mj_fast_reroll":         "fast",
	"mj_fast_modal":          "fast",
	"mj_fast_inpaint":        "fast",
	"mj_fast_zoom":           "fast",
	"mj_fast_custom_zoom":    "fast",
	"mj_fast_shorten":        "fast",
	"mj_fast_high_variation": "fast",
	"mj_fast_low_variation":  "fast",
	"mj_fast_pan":            "fast",
	"mj_fast_swap_face":      "fast",
	"mj_fast_upload":         "fast",
	"mj_fast_video":          "fast",
	"mj_fast_edits":          "fast",
	
	// 慢速模式动作模型映射
	"mj_relax_imagine":        "relax",
	"mj_relax_describe":       "relax",
	"mj_relax_blend":          "relax",
	"mj_relax_upscale":        "relax",
	"mj_relax_variation":      "relax",
	"mj_relax_reroll":         "relax",
	"mj_relax_modal":          "relax",
	"mj_relax_inpaint":        "relax",
	"mj_relax_zoom":           "relax",
	"mj_relax_custom_zoom":    "relax",
	"mj_relax_shorten":        "relax",
	"mj_relax_high_variation": "relax",
	"mj_relax_low_variation":  "relax",
	"mj_relax_pan":            "relax",
	"mj_relax_swap_face":      "relax",
	"mj_relax_upload":         "relax",
	"mj_relax_video":          "relax",
	"mj_relax_edits":          "relax",
	
	// 超快模式动作模型映射
	"mj_turbo_imagine":        "turbo",
	"mj_turbo_describe":       "turbo",
	"mj_turbo_blend":          "turbo",
	"mj_turbo_upscale":        "turbo",
	"mj_turbo_variation":      "turbo",
	"mj_turbo_reroll":         "turbo",
	"mj_turbo_modal":          "turbo",
	"mj_turbo_inpaint":        "turbo",
	"mj_turbo_zoom":           "turbo",
	"mj_turbo_custom_zoom":    "turbo",
	"mj_turbo_shorten":        "turbo",
	"mj_turbo_high_variation": "turbo",
	"mj_turbo_low_variation":  "turbo",
	"mj_turbo_pan":            "turbo",
	"mj_turbo_swap_face":      "turbo",
	"mj_turbo_upload":         "turbo",
	"mj_turbo_video":          "turbo",
	"mj_turbo_edits":          "turbo",
}

// 从模型名称提取模式
func ExtractModeFromModel(model string) string {
	if mode, exists := MidjourneyModel2Mode[model]; exists {
		return mode
	}
	return ""
}

// 将带模式的模型名称转换为标准模型名称
func ConvertModeModelToStandard(model string) string {
	// 如果是模式相关的模型，需要转换为对应的标准动作模型
	if _, exists := MidjourneyModel2Mode[model]; exists {
		// 对于新版本的模式模型(mj_fast_*, mj_relax_*, mj_turbo_*)，提取基础动作
		if strings.HasPrefix(model, "mj_fast_") {
			return "mj_" + strings.TrimPrefix(model, "mj_fast_")
		}
		if strings.HasPrefix(model, "mj_relax_") {
			return "mj_" + strings.TrimPrefix(model, "mj_relax_")
		}
		if strings.HasPrefix(model, "mj_turbo_") {
			return "mj_" + strings.TrimPrefix(model, "mj_turbo_")
		}
		// 对于旧版本的模式模型(mj-relax, mj-fast, mj-turbo)，转换为imagine
		return "mj_imagine"
	}
	return model
}

// 解析模型名称，返回基础动作和模式
func ParseModelNameAndMode(model string) (baseAction string, mode string) {
	// 检查是否是带模式的模型
	if extractedMode, exists := MidjourneyModel2Mode[model]; exists {
		mode = extractedMode
		baseAction = ConvertModeModelToStandard(model)
		return baseAction, mode
	}
	// 如果不是带模式的模型，返回原模型名称和空模式
	return model, ""
}

// 检查模型是否支持指定模式
func IsModelSupportMode(model string) bool {
	_, exists := MidjourneyModel2Mode[model]
	return exists
}

// 生成带模式的模型名称
func GenerateModeModel(baseAction string, mode string) string {
	// 如果模式为空，返回基础动作
	if mode == "" {
		return baseAction
	}
	
	// 生成新格式的模式模型名称
	if strings.HasPrefix(baseAction, "mj_") {
		actionName := strings.TrimPrefix(baseAction, "mj_")
		return "mj_" + mode + "_" + actionName
	}
	
	// 对于特殊情况，返回旧格式
	if baseAction == "mj_imagine" {
		return "mj-" + mode
	}
	
	return baseAction
}
