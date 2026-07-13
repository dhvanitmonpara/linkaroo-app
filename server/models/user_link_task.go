package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserLinkTask struct {
	ID         uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"_id"`
	UserLinkID uuid.UUID      `gorm:"type:uuid;index;not null" json:"userLinkId"`
	Title      string         `gorm:"not null" json:"title"`
	Date       string         `json:"date"`
	Completed  bool           `gorm:"default:false" json:"completed"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
