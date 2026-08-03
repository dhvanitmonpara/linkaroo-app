package models

import "strings"

// SourceType defines the recognized origin or service of an item.
type SourceType string

const (
	SourceYouTube    SourceType = "YOUTUBE"
	SourceAmazon     SourceType = "AMAZON"
	SourceIMDb       SourceType = "IMDB"
	SourceGoodreads  SourceType = "GOODREADS"
	SourceReddit     SourceType = "REDDIT"
	SourceGitHub     SourceType = "GITHUB"
	SourceMedium     SourceType = "MEDIUM"
	SourceSpotify    SourceType = "SPOTIFY"
	SourceTwitter    SourceType = "TWITTER"
	SourceArticle    SourceType = "ARTICLE"
	SourceLocalImage SourceType = "LOCAL_IMAGE"
	SourceLocalPDF   SourceType = "LOCAL_PDF"
	SourceLocalAudio SourceType = "LOCAL_AUDIO"
	SourceLocalVideo SourceType = "LOCAL_VIDEO"
	SourceText       SourceType = "TEXT"
	SourceUnknown    SourceType = "UNKNOWN"
)

// String returns the string representation of SourceType.
func (s SourceType) String() string {
	return string(s)
}

// NormalizeSourceType converts string input into a normalized SourceType.
func NormalizeSourceType(raw string) SourceType {
	upper := strings.ToUpper(strings.TrimSpace(raw))
	switch SourceType(upper) {
	case SourceYouTube, SourceAmazon, SourceIMDb, SourceGoodreads, SourceReddit,
		SourceGitHub, SourceMedium, SourceSpotify, SourceTwitter, SourceArticle,
		SourceLocalImage, SourceLocalPDF, SourceLocalAudio, SourceLocalVideo, SourceText:
		return SourceType(upper)
	default:
		return SourceUnknown
	}
}
