package db

import (
	"log"
	"os"

	"linkaroo-app/server/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=password dbname=linkaroo port=5432 sslmode=disable TimeZone=UTC"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database", err)
	}

	// Enable UUID extension
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";")

	// Auto Migrate the models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Tag{},
		&models.Link{},
		&models.Collection{},
		&models.UserLink{},
	)
	if err != nil {
		log.Fatal("Failed to auto-migrate database", err)
	}

	log.Println("Database connection and migration successful")
}
