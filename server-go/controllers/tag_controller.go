package controllers

import (
	"net/http"

	"linkaroo-app/server-go/db"
	"linkaroo-app/server-go/models"

	"github.com/gin-gonic/gin"
)

func CreateTag(c *gin.Context) {
	var input struct {
		Tagname string `json:"tagname" binding:"required"`
		OwnerID string `json:"ownerId" binding:"required"` // Should be from auth context ideally
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag := models.Tag{
		Tagname: input.Tagname,
	}

	if err := db.DB.Create(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tag"})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

func DeleteTag(c *gin.Context) {
	tagId := c.Param("tagId")

	if err := db.DB.Delete(&models.Tag{}, "id = ?", tagId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tag"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}
