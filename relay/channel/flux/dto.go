package flux

// FluxRequest represents the request payload for flux API
type FluxRequest struct {
	Prompt          string `json:"prompt"`
	AspectRatio     string `json:"aspect_ratio,omitempty"`
	Seed            *int   `json:"seed,omitempty"`
	SafetyTolerance *int   `json:"safety_tolerance,omitempty"`
	OutputFormat    string `json:"output_format,omitempty"`
	InputImage      string `json:"input_image,omitempty"` // Base64 encoded image for editing
}

// FluxResponse represents the response from flux API
type FluxResponse struct {
	ID    string `json:"id"`
	Error string `json:"error,omitempty"`
}

// FluxTaskResult represents the polling result from flux API
type FluxTaskResult struct {
	ID     string           `json:"id"`
	Status string           `json:"status"`
	Result *FluxImageResult `json:"result,omitempty"`
	Error  string           `json:"error,omitempty"`
}

// FluxImageResult represents the generated image result
type FluxImageResult struct {
	Sample string `json:"sample"` // Image URL
	Seed   int    `json:"seed"`
}
