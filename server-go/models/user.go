package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                   uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Username             string    `gorm:"uniqueIndex;not null"`
	ClerkID              string    `gorm:"uniqueIndex;not null"`
	Email                string    `gorm:"uniqueIndex;not null"`
	UseFullTypeFormAdder bool      `gorm:"default:true"`
	IsQuickSearchEnabled bool      `gorm:"default:true"`
	Theme                string    `gorm:"default:'dark'"`
	Font                 string    `gorm:"default:'font-helvetica'"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
	DeletedAt            gorm.DeletedAt `gorm:"index"`

	// Relationships
	Collections   []Collection  `gorm:"foreignKey:CreatedByID"`
	Tags          []Tag         `gorm:"foreignKey:OwnerID"`
	Collaborating []*Collection `gorm:"many2many:collection_collaborators;"`
	Viewing       []*Collection `gorm:"many2many:collection_viewers;"`
}
