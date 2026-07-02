package controllers

import (
	"net/http"

	"linkaroo-app/server-go/db"
	"linkaroo-app/server-go/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	var userLinks []models.UserLink
	// Need to preload Link since formatLinks expects linkId object
	if err := db.DB.Preload("Link").Find(&userLinks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch links"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": userLinks,
	})
}

func GetLinksByCollection(c *gin.Context) {
	collectionIDStr := c.Param("collectionId")
	collectionID, err := uuid.Parse(collectionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var userLinks []models.UserLink
	if err := db.DB.Preload("Link").Where("collection_id = ?", collectionID).Find(&userLinks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collection links"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": userLinks,
	})
}

func QuickAddLink(c *gin.Context) {
	collectionIDStr := c.Param("collectionId")
	collectionID, err := uuid.Parse(collectionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var req struct {
		Link   string `json:"link"`
		UserId string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create Link
	link := models.Link{
		Title:       req.Link,
		LinkURL:     req.Link,
		ContentType: "link",
	}
	if err := db.DB.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	// Check if userId is a valid UUID, if not generate a dummy one for now since User port isn't complete maybe
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		// Just to prevent breaking the flow if the frontend sends ClerkID instead of UUID.
		// Assuming frontend _id is actually User.ID since it works in other places.
		// If it fails, we return error
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Create UserLink
	userLink := models.UserLink{
		UserID:       userID,
		CollectionID: collectionID,
		LinkID:       link.ID,
	}
	if err := db.DB.Create(&userLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to map link to user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"link":     link,
			"userLink": userLink,
		},
	})
}
