package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Collection struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	CreatedByID *uuid.UUID     `gorm:"type:uuid;index" json:"createdById"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	CoverImage  string         `gorm:"default:''" json:"coverImage"`
	Icon        string         `gorm:"default:''" json:"icon"`
	Theme       string         `gorm:"default:'bg-zinc-200'" json:"theme"`
	IsPublic    bool           `gorm:"default:true" json:"isPublic"`
	IsInbox     bool           `gorm:"default:false" json:"isInbox"`
	Type        string         `gorm:"default:'todos'" json:"type"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`

	// Relationships
	CreatedBy     User    `gorm:"foreignKey:CreatedByID"`
	Tags          []*Tag  `gorm:"many2many:collection_tags;"`
	Collaborators []*User `gorm:"many2many:collection_collaborators;"`
	Viewers       []*User `gorm:"many2many:collection_viewers;"`
}
