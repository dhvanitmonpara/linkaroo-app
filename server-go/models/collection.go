package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Collection struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CreatedByID *uuid.UUID `gorm:"type:uuid;index"`
	Title       string     `gorm:"not null"`
	Description string
	CoverImage  string `gorm:"default:''"`
	Icon        string `gorm:"default:''"`
	Theme       string `gorm:"default:'bg-zinc-200'"`
	IsPublic    bool   `gorm:"default:true"`
	IsInbox     bool   `gorm:"default:false"`
	Type        string `gorm:"default:'todos'"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`

	// Relationships
	CreatedBy     User    `gorm:"foreignKey:CreatedByID"`
	Tags          []*Tag  `gorm:"many2many:collection_tags;"`
	Collaborators []*User `gorm:"many2many:collection_collaborators;"`
	Viewers       []*User `gorm:"many2many:collection_viewers;"`
}
