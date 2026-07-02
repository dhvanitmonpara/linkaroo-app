package routes

import (
	"linkaroo-app/server-go/controllers"
	"linkaroo-app/server-go/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(middleware.ErrorHandler())

	// Add CORS middleware
	config := cors.DefaultConfig()
	config.AllowOriginFunc = func(origin string) bool {
		return true // Allow all origins for development
	}
	config.AllowCredentials = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept"}
	r.Use(cors.New(config))

	// Public routes
	r.GET("/api/v1/healthcheck", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")

	// User Routes
	users := api.Group("/users")
	{
		users.POST("", controllers.CreateUser)
		users.GET("/current/:email", controllers.GetCurrentUser)

		secured := users.Group("")
		secured.Use(middleware.VerifyJWT())
		secured.PATCH("/update-account", controllers.UpdateAccountDetails)
	}

	// Collection Routes
	collections := api.Group("/collections")
	collections.Use(middleware.VerifyJWT())
	{
		collections.POST("", controllers.CreateCollection)
		collections.GET("/u/all/:userId", controllers.GetCollectionsByUser)
	}

	// Link Routes
	links := api.Group("/links")
	links.Use(middleware.VerifyJWT())
	{
		links.GET("/all", controllers.GetAllLinks)
		links.GET("/:collectionId", controllers.GetLinksByCollection)
		links.POST("/:collectionId", controllers.CreateLink)
		links.POST("/quick-add/:collectionId", controllers.QuickAddLink)
		links.DELETE("/:linkId", controllers.DeleteLink)
	}

	// Card Routes
	cards := api.Group("/cards")
	cards.Use(middleware.VerifyJWT())
	{
		cards.POST("/:collectionId", controllers.CreateCard)
	}


	// Tag Routes
	tags := api.Group("/tags")
	tags.Use(middleware.VerifyJWT())
	{
		tags.POST("", controllers.CreateTag)
		tags.DELETE("/:tagId", controllers.DeleteTag)
	}

	return r
}
