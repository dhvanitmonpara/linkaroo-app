package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func VerifyJWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Example simplistic JWT checking
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// for now, bypass auth or return error depending on strictness
			// c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized request"})
			// return
		}

		// tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		// In a real app we'd verify the token with Clerk or local JWT secret

		c.Next()
	}
}
