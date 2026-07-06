package main

import (
	"log"
	"os"

	"linkaroo-app/server/db"
	"linkaroo-app/server/routes"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Initialize Database
	db.InitDB()

	// Setup Router
	r := routes.SetupRouter()

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server", err)
	}
}
