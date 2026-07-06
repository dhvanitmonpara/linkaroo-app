package middleware

import (
	"fmt"
	"net/http"
	"os"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// ErrorHandler intercepts panics and generic errors
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				env := os.Getenv("ENV")
				if env == "" {
					env = "development" // default to dev
				}

				if env == "development" {
					// In development, print full stack trace and raw error
					stack := string(debug.Stack())
					fmt.Printf("[PANIC RECOVERED] %v\n%s\n", err, stack)
					c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
						"error":       fmt.Sprintf("%v", err),
						"stack_trace": stack,
					})
				} else {
					// In production, hide the stack trace from the user
					fmt.Printf("[PANIC RECOVERED] %v\n", err)
					c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
						"error": "Internal Server Error",
					})
				}
			}
		}()
		
		c.Next()
		
		// Handle errors collected by Gin during the request lifecycle
		if len(c.Errors) > 0 {
			env := os.Getenv("ENV")
			if env == "" {
				env = "development"
			}
			
			if env == "development" {
				// Print out all raw errors
				for _, ginErr := range c.Errors {
					fmt.Printf("[ERROR] %v\n", ginErr.Err)
				}
				c.JSON(-1, gin.H{
					"errors": c.Errors.Errors(),
				})
			} else {
				// Simplified error for production
				c.JSON(-1, gin.H{
					"error": "An error occurred",
				})
			}
		}
	}
}
