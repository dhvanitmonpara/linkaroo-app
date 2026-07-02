package utils

import (
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type Metadata struct {
	Title       string
	Description string
	Image       string
	Type        string
}

func FetchMetadata(targetURL string) Metadata {
	meta := Metadata{}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return meta
	}
	// Many sites require a user agent
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return meta
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return meta
	}

	// We only want to parse HTML
	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "text/html") {
		return meta
	}

	z := html.NewTokenizer(resp.Body)
	isTitle := false

	Loop:
	for {
		tt := z.Next()
		switch tt {
		case html.ErrorToken:
			break Loop // End of document or error
		case html.StartTagToken, html.SelfClosingTagToken:
			t := z.Token()
			switch t.Data {
			case "title":
				isTitle = true
			case "meta":
				var name, property, content string
				for _, a := range t.Attr {
					switch a.Key {
					case "name":
						name = a.Val
					case "property":
						property = a.Val
					case "content":
						content = a.Val
					}
				}

				if name == "description" && meta.Description == "" {
					meta.Description = content
				} else if property == "og:description" || name == "og:description" || property == "twitter:description" || name == "twitter:description" {
					meta.Description = content
				} else if property == "og:title" || name == "og:title" || property == "twitter:title" || name == "twitter:title" {
					meta.Title = content
				} else if property == "og:image" || name == "og:image" || property == "twitter:image" || name == "twitter:image" {
					meta.Image = content
				} else if property == "og:type" || name == "og:type" {
					meta.Type = content
				}
			}
		case html.TextToken:
			if isTitle {
				// Don't overwrite og:title if already set
				if meta.Title == "" {
					meta.Title = string(z.Text())
				}
				isTitle = false
			}
		case html.EndTagToken:
			// We no longer stop at </head> because some sites put meta tags inside <body> or have malformed HTML
			continue
		}
	}

	// Clean up GitHub titles to look much better than the default SEO tags
	if strings.Contains(targetURL, "github.com/") {
		u, _ := url.Parse(targetURL)
		parts := strings.Split(strings.Trim(u.Path, "/"), "/")
		if len(parts) >= 2 {
			meta.Title = parts[0] + "/" + parts[1]
		} else if len(parts) == 1 && parts[0] != "" {
			meta.Title = parts[0]
		}
	}

	return meta
}

func DetectContentType(targetURL, ogType string) string {
	u, err := url.Parse(targetURL)
	if err != nil {
		return "link"
	}

	lower := strings.ToLower(targetURL)
	host := strings.Replace(u.Hostname(), "www.", "", 1)

	// YouTube
	if host == "youtube.com" || host == "youtu.be" {
		if strings.Contains(u.Path, "/watch") || host == "youtu.be" {
			return "youtube"
		}
	}

	// Twitter / X
	if host == "twitter.com" || host == "x.com" {
		return "twitter"
	}

	// GitHub
	if host == "github.com" {
		parts := strings.Split(strings.Trim(u.Path, "/"), "/")
		if len(parts) >= 2 {
			return "github-repo"
		} else if len(parts) == 1 && parts[0] != "" {
			return "github-profile"
		}
		return "github"
	}

	// Instagram
	if host == "instagram.com" {
		return "instagram"
	}

	// Books
	if host == "goodreads.com" || host == "books.google.com" || host == "openlibrary.org" {
		return "book"
	}

	// Movies / TV
	if host == "imdb.com" || host == "letterboxd.com" || host == "rottentomatoes.com" {
		return "movie"
	}

	// Products / Shopping
	if host == "amazon.com" || host == "amazon.in" || host == "ebay.com" || host == "etsy.com" || host == "flipkart.com" {
		return "product"
	}

	// Spotify / Music
	if host == "open.spotify.com" || host == "soundcloud.com" {
		return "audio"
	}

	// Raw image files
	if matched, _ := regexp.MatchString(`\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$`, lower); matched {
		return "image"
	}

	// Raw audio files
	if matched, _ := regexp.MatchString(`\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$`, lower); matched {
		return "audio"
	}

	// Open Graph type hints
	if ogType != "" {
		og := strings.ToLower(ogType)
		if og == "video.other" || og == "video.movie" || og == "video.episode" {
			return "movie"
		}
		if og == "music.song" || og == "music.album" {
			return "audio"
		}
		if og == "book" {
			return "book"
		}
		if og == "article" || og == "blog" {
			return "article"
		}
		if og == "profile" {
			return "link" // keep generic for unknown profiles
		}
	}

	// Medium / Substack / dev.to / Hashnode / Blogger -> articles
	if strings.Contains(host, "medium.com") || strings.Contains(host, "substack.com") || host == "dev.to" || strings.Contains(host, "hashnode") || host == "hackernoon.com" || strings.Contains(host, "blogspot.com") || strings.Contains(host, "blogger.com") {
		return "article"
	}

	// URL-based article heuristics
	if strings.Contains(u.Path, "/blog/") || strings.Contains(u.Path, "/article/") || strings.Contains(u.Path, "/post/") || strings.Contains(u.Path, "/news/") || strings.Contains(u.Path, "/p/") {
		return "article"
	}

	// Date-based slug like /2023/10/25/
	if matched, _ := regexp.MatchString(`/\d{4}/\d{2}/\d{2}/`, u.Path); matched {
		return "article"
	}

	// Fallback
	return "link"
}

// GenerateTitleFromURL attempts to create a readable title from a URL path
// Example: /my-awesome-post-123 -> My Awesome Post 123
func GenerateTitleFromURL(targetURL string) string {
	u, err := url.Parse(targetURL)
	if err != nil {
		return targetURL
	}
	
	path := strings.TrimSuffix(u.Path, "/")
	if path == "" {
		return u.Hostname()
	}
	
	segments := strings.Split(path, "/")
	lastSegment := segments[len(segments)-1]
	
	// Remove common file extensions
	if idx := strings.LastIndex(lastSegment, "."); idx > 0 {
		lastSegment = lastSegment[:idx]
	}
	
	// Replace hyphens and underscores with spaces
	lastSegment = strings.ReplaceAll(lastSegment, "-", " ")
	lastSegment = strings.ReplaceAll(lastSegment, "_", " ")
	
	// Capitalize words
	words := strings.Fields(lastSegment)
	for i, w := range words {
		if len(w) > 0 {
			// Basic capitalization
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	
	title := strings.Join(words, " ")
	if title == "" {
		return targetURL
	}
	return title
}
