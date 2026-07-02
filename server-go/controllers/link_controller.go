package controllers

import (
	"net/http"
	"net/url"

	"linkaroo-app/server-go/db"
	"linkaroo-app/server-go/models"
	"linkaroo-app/server-go/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateLink(c *gin.Context) {
	collectionIDStr := c.Param("collectionId")
	collectionID, err := uuid.Parse(collectionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Link        string `json:"link"`
		UserId      string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	meta := utils.FetchMetadata(req.Link)
	isReachable := meta.Title != "" || meta.Description != ""

	title := req.Title
	if title == "" && meta.Title != "" {
		title = meta.Title
	}
	if title == "" {
		title = utils.GenerateTitleFromURL(req.Link)
	}

	description := req.Description
	if description == "" {
		description = meta.Description
	}

	link := models.Link{
		LinkURL: req.Link,
	}

	if err := db.DB.Where(&link).Attrs(models.Link{
		Title:       title,
		Description: description,
		Image:       meta.Image,
		ContentType: utils.DetectContentType(req.Link, meta.Type),
	}).FirstOrCreate(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	userLink := models.UserLink{
		UserID:            userID,
		CollectionID:      collectionID,
		LinkID:            link.ID,
		CustomTitle:       &title,
		CustomDescription: &description,
	}
	if err := db.DB.Create(&userLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to map link to user"})
		return
	}

	db.DB.Preload("Link").First(&userLink, userLink.ID)

	customLink := gin.H{
		"title":        title,
		"description":  description,
		"collectionId": collectionID,
		"link":         link.LinkURL,
		"image":        meta.Image,
		"isChecked":    false,
		"contentType":  link.ContentType,
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"data":            customLink,
			"isLinkReachable": isReachable,
		},
	})
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

	// Determine if it's a valid URL
	isLink := false
	u, err := url.ParseRequestURI(req.Link)
	if err == nil && u.Scheme != "" && u.Host != "" {
		isLink = true
	}

	var link models.Link
	var customTitle, customDescription *string

	if isLink {
		meta := utils.FetchMetadata(req.Link)
		title := meta.Title
		if title == "" {
			title = utils.GenerateTitleFromURL(req.Link)
		}
		contentType := utils.DetectContentType(req.Link, meta.Type)

		link = models.Link{
			LinkURL: req.Link,
		}
		if err := db.DB.Where(&link).Attrs(models.Link{
			Title:       title,
			Description: meta.Description,
			Image:       meta.Image,
			ContentType: contentType,
		}).FirstOrCreate(&link).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
			return
		}
	} else {
		// Treat as note
		noteTitle := req.Link
		if len(noteTitle) > 100 {
			noteTitle = noteTitle[:97] + "..."
		}
		noteDesc := req.Link
		customTitle = &noteTitle
		customDescription = &noteDesc

		link = models.Link{
			Title:       noteTitle,
			Description: noteDesc,
			LinkURL:     uuid.New().String(), // Unique string to satisfy DB constraints
			ContentType: "note",
		}
		if err := db.DB.Create(&link).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
			return
		}
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

	// Set customTitle and customDescription to match link (since frontend formatter expects them here for QuickAdd)
	if customTitle == nil {
		customTitle = &link.Title
	}
	if customDescription == nil {
		customDescription = &link.Description
	}

	// Create UserLink
	userLink := models.UserLink{
		UserID:            userID,
		CollectionID:      collectionID,
		LinkID:            link.ID,
		CustomTitle:       customTitle,
		CustomDescription: customDescription,
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

func CreateCard(c *gin.Context) {
	collectionIDStr := c.Param("collectionId")
	collectionID, err := uuid.Parse(collectionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collection ID"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Link        string `json:"link"`
		UserId      string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Determine if it's a valid URL
	isLink := false
	u, err := url.ParseRequestURI(req.Link)
	if err == nil && u.Scheme != "" && u.Host != "" {
		isLink = true
	}

	var link models.Link
	if isLink {
		meta := utils.FetchMetadata(req.Link)
		title := req.Title
		if title == "" {
			title = meta.Title
		}
		if title == "" {
			title = utils.GenerateTitleFromURL(req.Link)
		}
		
		description := req.Description
		if description == "" {
			description = meta.Description
		}

		link = models.Link{
			LinkURL: req.Link,
		}
		if err := db.DB.Where(&link).Attrs(models.Link{
			Title:       title,
			Description: description,
			Image:       meta.Image,
			ContentType: utils.DetectContentType(req.Link, meta.Type),
		}).FirstOrCreate(&link).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
			return
		}
	} else {
		// Content based card (note)
		link = models.Link{
			Title:       req.Title,
			Description: req.Description,
			LinkURL:     uuid.New().String(), // Unique string to satisfy DB constraints
			ContentType: "note",
		}
		if err := db.DB.Create(&link).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
			return
		}
	}

	userLink := models.UserLink{
		UserID:            userID,
		CollectionID:      collectionID,
		LinkID:            link.ID,
		CustomTitle:       &link.Title,
		CustomDescription: &link.Description,
	}
	if err := db.DB.Create(&userLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to map link to user"})
		return
	}

	db.DB.Preload("Link").First(&userLink, userLink.ID)

	customLink := gin.H{
		"title":        link.Title,
		"description":  link.Description,
		"collectionId": collectionID,
		"link":         link.LinkURL,
		"image":        link.Image,
		"isChecked":    false,
		"contentType":  link.ContentType,
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": customLink,
	})
}

func DeleteLink(c *gin.Context) {
	linkIDStr := c.Param("linkId")
	linkID, err := uuid.Parse(linkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	var userLink models.UserLink
	if err := db.DB.First(&userLink, linkID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	// Delete the UserLink
	if err := db.DB.Delete(&userLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
		return
	}

	// Check if any other users still reference this link
	var otherReferences int64
	db.DB.Model(&models.UserLink{}).Where("link_id = ?", userLink.LinkID).Count(&otherReferences)

	// If no other users have this link, delete the actual Link document
	if otherReferences == 0 {
		db.DB.Delete(&models.Link{}, "id = ?", userLink.LinkID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link deleted successfully"})
}
