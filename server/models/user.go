package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                   uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	Username             string         `gorm:"uniqueIndex;not null" json:"username"`
	ClerkID              string         `gorm:"uniqueIndex;not null" json:"clerkId"`
	Email                string         `gorm:"uniqueIndex;not null" json:"email"`
	UseFullTypeFormAdder bool           `gorm:"default:true" json:"useFullTypeFormAdder"`
	IsQuickSearchEnabled bool           `gorm:"default:true" json:"isSearchShortcutEnabled"`
	Theme                string         `gorm:"default:'dark'" json:"theme"`
	Font                 string         `gorm:"default:'font-helvetica'" json:"font"`
	CreatedAt            time.Time      `json:"createdAt"`
	UpdatedAt            time.Time      `json:"updatedAt"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"deletedAt"`

	// Relationships
	Collections   []Collection  `gorm:"foreignKey:CreatedByID" json:"collections,omitempty"`
	Tags          []Tag         `gorm:"foreignKey:OwnerID" json:"tags,omitempty"`
	Collaborating []*Collection `gorm:"many2many:collection_collaborators;" json:"collaborating,omitempty"`
	Viewing       []*Collection `gorm:"many2many:collection_viewers;" json:"viewing,omitempty"`
}
