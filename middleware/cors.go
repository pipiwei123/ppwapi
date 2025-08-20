package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	config := cors.DefaultConfig()
	// 不能同时设置 AllowAllOrigins = true 和 AllowCredentials = true
	// 当 AllowCredentials = true 时，必须明确指定允许的来源
	config.AllowAllOrigins = false
	config.AllowOriginFunc = func(origin string) bool {
		// 在开发环境中允许所有来源，生产环境中应该限制具体域名
		return true
	}
	config.AllowCredentials = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"*"}
	return cors.New(config)
}
