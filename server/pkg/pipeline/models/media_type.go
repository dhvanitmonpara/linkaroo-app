package models

// MediaType defines canonical media classifications across Linkaroo.
type MediaType string

const (
	MediaTypeUnknown          MediaType = "Unknown"
	MediaTypeArticle          MediaType = "Article"
	MediaTypeBook             MediaType = "Book"
	MediaTypeMovie            MediaType = "Movie"
	MediaTypeTVShow           MediaType = "TVShow"
	MediaTypeVideo            MediaType = "Video"
	MediaTypeAudio            MediaType = "Audio"
	MediaTypeAudiobook        MediaType = "Audiobook"
	MediaTypeImage            MediaType = "Image"
	MediaTypeScreenshot       MediaType = "Screenshot"
	MediaTypePDF              MediaType = "PDF"
	MediaTypeDocument         MediaType = "Document"
	MediaTypeProduct          MediaType = "Product"
	MediaTypePlace            MediaType = "Place"
	MediaTypeTweet            MediaType = "Tweet"
	MediaTypeRedditPost       MediaType = "RedditPost"
	MediaTypeGitHubRepository MediaType = "GitHubRepository"
	MediaTypeMusic            MediaType = "Music"
	MediaTypePlaylist         MediaType = "Playlist"
	MediaTypeNote             MediaType = "Note"
	MediaTypeTask             MediaType = "Task"
)

// String returns the string representation of MediaType.
func (m MediaType) String() string {
	return string(m)
}
