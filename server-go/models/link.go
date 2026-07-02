package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Link struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title       string    `gorm:"not null"`
	Description string
	Image       string
	LinkURL     string `gorm:"uniqueIndex;not null;column:link"` // renamed to LinkURL in struct to avoid conflict
	ContentType string `gorm:"default:'link'"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}
