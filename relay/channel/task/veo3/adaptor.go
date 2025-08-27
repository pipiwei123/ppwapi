package veo3

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"one-api/common"
	"one-api/constant"
	"one-api/dto"
	"one-api/model"
	"one-api/relay/channel"
	relaycommon "one-api/relay/common"
	"one-api/service"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

// ============================
// Request / Response structures
// ============================

type SubmitReq struct {
	Prompt        string   `json:"prompt"`
	Model         string   `json:"model,omitempty"`
	EnhancePrompt *bool    `json:"enhance_prompt,omitempty"`
	Images        []string `json:"images,omitempty"`
}

type CreateResponse struct {
	Data    string `json:"data"` // task_id
	Code    string `json:"code"` // IN_PROGRESS
	Message string `json:"message"`
}

type StatusResponse struct {
	FinishTime int64  `json:"finishTime"`
	StartTime  int64  `json:"startTime"`
	Status     string `json:"status"` // SUCCESS/PROCESSING/FAILED
	TaskId     string `json:"taskId"`
	VideoUrl   string `json:"videoUrl"`
}

// ============================
// Adaptor implementation
// ============================

type TaskAdaptor struct {
	ChannelType int
	baseURL     string
	apiKey      string
}

func (a *TaskAdaptor) Init(info *relaycommon.TaskRelayInfo) {
	a.ChannelType = info.ChannelType
	a.baseURL = info.BaseUrl
	a.apiKey = info.ApiKey
}

// ValidateRequestAndSetAction parses body, validates fields and sets default action.
func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.TaskRelayInfo) (taskErr *dto.TaskError) {
	// Accept only POST /v1/video/generations as "generate" action.
	action := constant.TaskActionGenerate
	info.Action = action

	var req SubmitReq
	if err := common.UnmarshalBodyReusable(c, &req); err != nil {
		taskErr = service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
		return
	}
	if req.Prompt == "" {
		taskErr = service.TaskErrorWrapperLocal(fmt.Errorf("prompt is required"), "invalid_request", http.StatusBadRequest)
		return
	}

	// Store into context for later usage
	c.Set("task_request", req)
	return nil
}

// BuildRequestURL constructs the upstream URL.
func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.TaskRelayInfo) (string, error) {
	fullURL := fmt.Sprintf("%s/v1/veo/videos", a.baseURL)
	return fullURL, nil
}

// BuildRequestHeader sets required headers.
func (a *TaskAdaptor) BuildRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.TaskRelayInfo) error {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", a.apiKey)
	return nil
}

// BuildRequestBody converts request into Veo3 specific format.
func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.TaskRelayInfo) (io.Reader, error) {
	v, exists := c.Get("task_request")
	if !exists {
		return nil, fmt.Errorf("request not found in context")
	}
	req := v.(SubmitReq)

	// Convert to Veo3 API format
	veo3Req := map[string]interface{}{
		"prompt": req.Prompt,
	}

	if req.Model != "" {
		veo3Req["model"] = req.Model
	}

	if req.EnhancePrompt != nil {
		veo3Req["enhance_prompt"] = *req.EnhancePrompt
	}

	if len(req.Images) > 0 {
		veo3Req["images"] = req.Images
	}

	data, err := json.Marshal(veo3Req)
	if err != nil {
		return nil, err
	}

	return bytes.NewReader(data), nil
}

// DoRequest delegates to common helper.
func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.TaskRelayInfo, requestBody io.Reader) (*http.Response, error) {
	return channel.DoTaskApiRequest(a, c, info, requestBody)
}

// DoResponse handles upstream response, returns taskID etc.
func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.TaskRelayInfo) (taskID string, taskData []byte, taskErr *dto.TaskError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		taskErr = service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
		return
	}

	// Parse Veo3 response
	var veo3Resp CreateResponse
	if err := json.Unmarshal(responseBody, &veo3Resp); err != nil {
		taskErr = service.TaskErrorWrapper(errors.Wrapf(err, "body: %s", responseBody), "unmarshal_response_body_failed", http.StatusInternalServerError)
		return
	}

	// Check if request was successful
	if veo3Resp.Code != "success" {
		taskErr = service.TaskErrorWrapper(fmt.Errorf(veo3Resp.Message), veo3Resp.Code, http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, veo3Resp)
	// Return the task ID from the data field
	return veo3Resp.Data, responseBody, nil
}

// FetchTask fetch task status
func (a *TaskAdaptor) FetchTask(baseUrl, key string, body map[string]any) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid task_id")
	}

	url := fmt.Sprintf("%s/v1/veo/tasks/%s", baseUrl, taskID)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", key)

	return service.GetHttpClient().Do(req)
}

func (a *TaskAdaptor) GetModelList() []string {
	return []string{"veo3-pro-frames"}
}

func (a *TaskAdaptor) GetChannelName() string {
	return "veo3"
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	var statusResp StatusResponse
	err := json.Unmarshal(respBody, &statusResp)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal response body")
	}

	taskInfo := &relaycommon.TaskInfo{}
	taskInfo.TaskID = statusResp.TaskId

	// Map status from Veo3 API to internal status
	switch statusResp.Status {
	case "SUCCESS":
		taskInfo.Status = model.TaskStatusSuccess
		taskInfo.Code = 0
		taskInfo.Url = statusResp.VideoUrl
	case "PROCESSING":
		taskInfo.Status = model.TaskStatusInProgress
		taskInfo.Code = 0
	case "FAILED":
		taskInfo.Status = model.TaskStatusFailure
		taskInfo.Code = -1
		taskInfo.Reason = "Task failed"
	default:
		taskInfo.Status = model.TaskStatusInProgress
		taskInfo.Code = 0
	}

	return taskInfo, nil
}
