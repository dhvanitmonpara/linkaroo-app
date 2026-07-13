package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tag struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	Tagname   string     `gorm:"uniqueIndex;not null" json:"tagname"`
	OwnerID   *uuid.UUID `gorm:"type:uuid;index" json:"ownerId"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Owner User `gorm:"foreignKey:OwnerID"`
}
