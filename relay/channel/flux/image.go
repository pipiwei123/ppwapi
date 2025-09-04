package flux

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"one-api/common"
	"one-api/dto"
	relaycommon "one-api/relay/common"
	"one-api/types"
	"time"

	"github.com/gin-gonic/gin"
)

// fluxImageHandler handles the Flux image generation response with polling logic
func fluxImageHandler(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (*dto.Usage, *types.NewAPIError) {
	var fluxResponse FluxResponse
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeReadResponseBodyFailed)
	}
	common.CloseResponseBodyGracefully(resp)

	err = json.Unmarshal(responseBody, &fluxResponse)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}

	// Check if the initial response indicates an error
	if fluxResponse.Error != "" {
		return nil, types.WithOpenAIError(types.OpenAIError{
			Message: fluxResponse.Error,
			Type:    "flux_error",
			Code:    "invalid_request",
		}, resp.StatusCode)
	}

	if fluxResponse.ID == "" {
		return nil, types.WithOpenAIError(types.OpenAIError{
			Message: "No task ID returned from flux API",
			Type:    "flux_error",
			Code:    "invalid_response",
		}, http.StatusBadGateway)
	}

	// Poll for the result with increasing intervals
	result, err := pollFluxResult(info.BaseUrl, info.ApiKey, fluxResponse.ID)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeDoRequestFailed)
	}

	if result.Error != "" {
		return nil, types.WithOpenAIError(types.OpenAIError{
			Message: result.Error,
			Type:    "flux_error",
			Code:    "generation_failed",
		}, http.StatusBadGateway)
	}

	if result.Result == nil {
		return nil, types.WithOpenAIError(types.OpenAIError{
			Message: "No result available",
			Type:    "flux_error",
			Code:    "no_result",
		}, http.StatusBadGateway)
	}

	// Convert Flux response to OpenAI format
	fullTextResponse := responseFlux2OpenAIImage(result, info)
	jsonResponse, err := json.Marshal(fullTextResponse)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}

	c.Writer.Header().Set("Content-Type", "application/json")
	c.Writer.WriteHeader(http.StatusOK)
	_, err = c.Writer.Write(jsonResponse)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}

	return &dto.Usage{
		TotalTokens: 1000, // Default token cost for image generation
	}, nil
}

// pollFluxResult polls the flux API for the generation result
func pollFluxResult(baseURL, apiKey, taskID string) (*FluxTaskResult, error) {
	pollingURL := fmt.Sprintf("%s/v1/get_result", baseURL)

	// Polling configuration
	maxAttempts := 120 // Max 60 seconds (120 * 500ms)
	interval := 500 * time.Millisecond
	maxInterval := 2 * time.Second

	for attempt := 0; attempt < maxAttempts; attempt++ {
		// Create polling request
		requestBody := map[string]string{"id": taskID}
		requestJSON, err := json.Marshal(requestBody)
		if err != nil {
			return nil, err
		}

		req, err := http.NewRequest("POST", pollingURL, bytes.NewBuffer(requestJSON))
		if err != nil {
			return nil, err
		}

		req.Header.Set("x-key", apiKey)
		req.Header.Set("Content-Type", "application/json")

		// Send polling request
		client := &http.Client{
			Timeout: 10 * time.Second,
		}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}

		responseBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}

		// Parse response
		var result FluxTaskResult
		err = json.Unmarshal(responseBody, &result)
		if err != nil {
			return nil, err
		}

		// Check if generation is complete
		if result.Status == "Ready" && result.Result != nil {
			return &result, nil
		}

		// Check for error status
		if result.Status == "Error" || result.Error != "" {
			return &result, nil
		}

		// Wait before next poll, with exponential backoff
		time.Sleep(interval)
		if interval < maxInterval {
			interval = time.Duration(float64(interval) * 1.2)
			if interval > maxInterval {
				interval = maxInterval
			}
		}
	}

	return nil, fmt.Errorf("polling timeout: task did not complete in time")
}

// responseFlux2OpenAIImage converts Flux response to OpenAI format
func responseFlux2OpenAIImage(fluxResult *FluxTaskResult, info *relaycommon.RelayInfo) *dto.ImageResponse {
	imageResponse := dto.ImageResponse{
		Created: info.StartTime.Unix(),
		Data: []dto.ImageData{
			{
				Url: fluxResult.Result.Sample,
			},
		},
	}

	return &imageResponse
}
