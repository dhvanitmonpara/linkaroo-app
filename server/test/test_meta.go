package main

import (
	"fmt"
	"linkaroo-app/server/utils"
)

func main() {
	urls := []string{
		"https://chatgpt.com",
		"https://github.com",
		"https://google.com",
	}
	for _, u := range urls {
		meta := utils.FetchMetadata(u)
		fmt.Printf("URL: %s\nTitle: %q\nDesc: %q\nImage: %q\n\n", u, meta.Title, meta.Description, meta.Image)
	}
}
