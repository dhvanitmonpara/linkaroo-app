package controllers

import (
	"net/http"

	"linkaroo-app/server-go/db"
	"linkaroo-app/server-go/models"

	"github.com/gin-gonic/gin"
)

func CreateLink(c *gin.Context) {
	// Dummy implementation for now
	var input models.Link
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func GetAllLinks(c *gin.Context) {
	var links []models.Link
	if err := db.DB.Find(&links).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch links"})
		return
	}
	c.JSON(http.StatusOK, links)
}
