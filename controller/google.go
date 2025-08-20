package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"one-api/common"
	"one-api/model"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type GoogleOAuthResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

type GoogleUser struct {
	Id            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

func getGoogleUserInfoByCode(code string, c *gin.Context) (*GoogleUser, error) {
	if code == "" {
		return nil, errors.New("无效的参数")
	}

	// Get redirect URI - must match exactly what was sent to Google
	// First try to get from Origin header, then construct from request
	origin := c.GetHeader("Origin")
	if origin == "" {
		// Fallback: construct from request, considering proxy headers
		scheme := "http"
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" || c.GetHeader("X-Forwarded-Ssl") == "on" {
			scheme = "https"
		}

		host := c.Request.Host
		if forwardedHost := c.GetHeader("X-Forwarded-Host"); forwardedHost != "" {
			host = forwardedHost
		}

		origin = fmt.Sprintf("%s://%s", scheme, host)
	}
	redirectURI := origin + "/oauth/google"

	// Log for debugging
	common.SysLog(fmt.Sprintf("OAuth Debug - Origin header: %s", origin))
	common.SysLog(fmt.Sprintf("OAuth Debug - Request Host: %s", c.Request.Host))
	common.SysLog(fmt.Sprintf("OAuth Debug - X-Forwarded-Host: %s", c.GetHeader("X-Forwarded-Host")))
	common.SysLog(fmt.Sprintf("OAuth Debug - X-Forwarded-Proto: %s", c.GetHeader("X-Forwarded-Proto")))
	common.SysLog(fmt.Sprintf("OAuth Debug - Using redirect_uri: %s", redirectURI))

	// Get access token
	values := url.Values{}
	values.Set("client_id", common.GoogleClientId)
	values.Set("client_secret", common.GoogleClientSecret)
	values.Set("code", code)
	values.Set("grant_type", "authorization_code")
	values.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", "https://oauth2.googleapis.com/token", strings.NewReader(values.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := http.Client{
		Timeout: 5 * time.Second,
	}
	res, err := client.Do(req)
	if err != nil {
		common.SysLog(err.Error())
		return nil, errors.New("无法连接至 Google 服务器，请稍后重试！")
	}
	defer res.Body.Close()

	// Read response body for debugging
	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	// Check HTTP status code
	if res.StatusCode != 200 {
		common.SysLog(fmt.Sprintf("Google OAuth token request failed with status %d: %s", res.StatusCode, string(bodyBytes)))
		return nil, errors.New(fmt.Sprintf("获取访问令牌失败，状态码: %d", res.StatusCode))
	}

	var oAuthResponse GoogleOAuthResponse
	err = json.Unmarshal(bodyBytes, &oAuthResponse)
	if err != nil {
		common.SysLog(fmt.Sprintf("Failed to parse Google OAuth response: %s", string(bodyBytes)))
		return nil, errors.New("解析 Google 响应失败")
	}

	if oAuthResponse.AccessToken == "" {
		common.SysLog(fmt.Sprintf("Google OAuth response without access token: %s", string(bodyBytes)))
		return nil, errors.New("获取访问令牌失败：响应中缺少访问令牌")
	}

	// Get user info
	req, err = http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oAuthResponse.AccessToken))

	res2, err := client.Do(req)
	if err != nil {
		common.SysLog(err.Error())
		return nil, errors.New("无法连接至 Google 服务器，请稍后重试！")
	}
	defer res2.Body.Close()

	var googleUser GoogleUser
	err = json.NewDecoder(res2.Body).Decode(&googleUser)
	if err != nil {
		return nil, err
	}

	if googleUser.Id == "" {
		return nil, errors.New("返回值非法，用户字段为空，请稍后重试！")
	}

	return &googleUser, nil
}

func GoogleOAuth(c *gin.Context) {
	session := sessions.Default(c)
	state := c.Query("state")
	if state == "" || session.Get("oauth_state") == nil || state != session.Get("oauth_state").(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "state is empty or not same",
		})
		return
	}

	// 检查是否是绑定请求（用户已登录且想绑定Google账户）
	// 只有当用户已登录且明确要求绑定时才走绑定逻辑
	userId := session.Get("id")
	if userId != nil {
		// 用户已登录，检查是否是绑定请求
		// 这里我们需要一个参数来区分是登录还是绑定
		// 暂时注释掉自动绑定，让用户明确选择登录
		// GoogleBind(c)
		// return

		// 清除现有登录状态，允许用户用Google账户重新登录
		session.Delete("id")
		session.Delete("username")
		session.Delete("role")
		session.Delete("status")
		session.Delete("group")
		// 不要立即保存，等到设置新的登录信息时一起保存
	}

	if !common.GoogleOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 Google 登录以及注册",
		})
		return
	}

	code := c.Query("code")
	googleUser, err := getGoogleUserInfoByCode(code, c)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user := model.User{
		GoogleId: googleUser.Id,
	}

	// IsGoogleIdAlreadyTaken is unscoped
	if model.IsGoogleIdAlreadyTaken(user.GoogleId) {
		// FillUserByGoogleId is scoped
		err := user.FillUserByGoogleId()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
		// if user.Id == 0 , user has been deleted
		if user.Id == 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "用户已注销",
			})
			return
		}
	} else {
		if common.RegisterEnabled {
			user.Username = "google_" + strconv.Itoa(model.GetMaxUserId()+1)
			if googleUser.Name != "" {
				user.DisplayName = googleUser.Name
			} else {
				user.DisplayName = "Google User"
			}
			user.Email = googleUser.Email
			user.Role = common.RoleCommonUser
			user.Status = common.UserStatusEnabled

			affCode := session.Get("aff")
			inviterId := 0
			if affCode != nil {
				inviterId, _ = model.GetUserIdByAffCode(affCode.(string))
			}

			if err := user.Insert(inviterId); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "管理员关闭了新用户注册",
			})
			return
		}
	}

	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "用户已被封禁",
			"success": false,
		})
		return
	}

	setupLogin(&user, c)
}

func GoogleBind(c *gin.Context) {
	if !common.GoogleOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "管理员未开启通过 Google 登录以及注册",
		})
		return
	}

	code := c.Query("code")
	googleUser, err := getGoogleUserInfoByCode(code, c)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user := model.User{
		GoogleId: googleUser.Id,
	}

	if model.IsGoogleIdAlreadyTaken(user.GoogleId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 Google 账户已被绑定",
		})
		return
	}

	session := sessions.Default(c)
	id := session.Get("id")
	user.Id = id.(int)
	err = user.FillUserById()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user.GoogleId = googleUser.Id
	err = user.Update(false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bind",
	})
	return
}
