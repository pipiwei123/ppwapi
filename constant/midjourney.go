package constant

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
	// 支持模式映射的模型
	"mj-relax": MjActionImagine,
	"mj-fast":  MjActionImagine,
	"mj-turbo": MjActionImagine,
}

// 模型名称到模式的映射
var MidjourneyModel2Mode = map[string]string{
	"mj-relax": "relax",
	"mj-fast":  "fast",
	"mj-turbo": "turbo",
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
	// 如果是模式相关的模型，转换为标准的imagine模型
	if _, exists := MidjourneyModel2Mode[model]; exists {
		return "mj_imagine"
	}
	return model
}
