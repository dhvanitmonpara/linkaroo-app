package controllers

import (
	"net/http"

	"linkaroo-app/server/db"
	"linkaroo-app/server/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	var existingTag models.Tag
	if err := db.DB.Where("tagname = ?", input.Tagname).First(&existingTag).Error; err == nil {
		// Tag already exists, return it instead of throwing an error
		c.JSON(http.StatusOK, existingTag)
		return
	}

	ownerUUID, err := uuid.Parse(input.OwnerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid owner ID format"})
		return
	}

	tag := models.Tag{
		Tagname: input.Tagname,
		OwnerID: &ownerUUID,
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

func GetTagsByUser(c *gin.Context) {
	userId := c.Param("userId")
	var tags []models.Tag
	if err := db.DB.Where("owner_id = ?", userId).Find(&tags).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func GetTagsByCollection(c *gin.Context) {
	collectionId := c.Param("collectionId")
	var collection models.Collection
	if err := db.DB.Preload("Tags").First(&collection, "id = ?", collectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": collection.Tags})
}
