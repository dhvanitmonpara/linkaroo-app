package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Link struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	LinkURL     string    `gorm:"uniqueIndex;not null;column:link" json:"link"` // renamed to LinkURL in struct to avoid conflict
	ContentType string    `gorm:"default:'link'" json:"contentType"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
