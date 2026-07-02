package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserLink struct {
	ID                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID            uuid.UUID `gorm:"type:uuid;index;not null"`
	CollectionID      uuid.UUID `gorm:"type:uuid;index;not null"`
	LinkID            uuid.UUID `gorm:"type:uuid;index;not null"`
	CustomTitle       *string
	CustomDescription *string
	IsChecked         bool `gorm:"default:false"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         gorm.DeletedAt `gorm:"index"`

	// Relationships
	User       User       `gorm:"foreignKey:UserID"`
	Collection Collection `gorm:"foreignKey:CollectionID"`
	Link       Link       `gorm:"foreignKey:LinkID"`
}
