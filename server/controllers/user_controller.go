package controllers

import (
	"net/http"

	"linkaroo-app/server/db"
	"linkaroo-app/server/models"

	"github.com/gin-gonic/gin"
)

func GetCurrentUser(c *gin.Context) {
	email := c.Param("email")
	var user models.User

	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"statusCode": 404,
			"data":       nil,
			"message":    "User not found",
			"success":    false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statusCode": 200,
		"data":       user,
		"message":    "Current user fetched successfully",
		"success":    true,
	})
}

func CreateUser(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required"`
		ClerkID  string `json:"clerkId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := db.DB.Where("email = ? OR clerk_id = ?", input.Email, input.ClerkID).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"statusCode": 200,
			"data": gin.H{
				"user": existingUser,
			},
			"message": "User with email or username already exists",
			"success": true,
		})
		return
	}

	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		ClerkID:  input.ClerkID,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": 400,
			"message":    "User with email or username already exists",
			"success":    false,
		})
		return
	}

	// Auto-create Inbox collection for new user
	inboxCollection := models.Collection{
		Title:       "Inbox",
		IsInbox:     true,
		CreatedByID: &user.ID,
	}
	db.DB.Create(&inboxCollection)

	c.JSON(http.StatusCreated, gin.H{
		"statusCode": 201,
		"data": gin.H{
			"user": user,
		},
		"message": "User registered successfully",
		"success": true,
	})
}

func UpdateAccountDetails(c *gin.Context) {
	// Dummy implementation
	c.JSON(http.StatusOK, gin.H{"message": "Not implemented yet"})
}
