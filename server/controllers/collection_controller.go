package controllers

import (
	"net/http"

	"linkaroo-app/server/db"
	"linkaroo-app/server/models"

	"github.com/gin-gonic/gin"
)

func CreateCollection(c *gin.Context) {
	var input models.Collection
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collection"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func GetCollectionsByUser(c *gin.Context) {
	userId := c.Param("userId")
	var collections []models.Collection

	if err := db.DB.Where("created_by_id = ?", userId).Find(&collections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collections"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": collections})
}
