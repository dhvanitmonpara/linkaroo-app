package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tag struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Tagname   string     `gorm:"uniqueIndex;not null"`
	OwnerID   *uuid.UUID `gorm:"type:uuid;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Relationships
	Owner User `gorm:"foreignKey:OwnerID"`
}
