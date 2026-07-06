package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserLink struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	UserID            uuid.UUID `gorm:"type:uuid;index;not null" json:"userId"`
	CollectionID      uuid.UUID `gorm:"type:uuid;index;not null" json:"collectionId"`
	LinkID            uuid.UUID `gorm:"type:uuid;index;not null" json:"linkIdRaw"`
	CustomTitle       *string   `json:"customTitle"`
	CustomDescription *string   `json:"customDescription"`
	IsChecked         bool      `gorm:"default:false" json:"isChecked"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"deletedAt"`

	// Relationships
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Collection Collection `gorm:"foreignKey:CollectionID" json:"collection,omitempty"`
	Link       Link       `gorm:"foreignKey:LinkID" json:"linkId,omitempty"`
}
