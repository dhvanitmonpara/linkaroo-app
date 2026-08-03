package models

import (
	"bytes"
	"io"
	"net/url"
	"strings"
)

// RawItem represents un-processed incoming user data to be identified and extracted.
type RawItem struct {
	ID             string            `json:"id"`
	URL            string            `json:"url,omitempty"`
	Payload        []byte            `json:"payload,omitempty"`
	MIMEType       string            `json:"mime_type,omitempty"`
	Text           string            `json:"text,omitempty"`
	Filename       string            `json:"filename,omitempty"`
	Headers        map[string]string `json:"headers,omitempty"`
	HintSourceType SourceType        `json:"hint_source_type,omitempty"`
}

// IsURL returns true if RawItem contains a valid HTTP/HTTPS URL.
func (r *RawItem) IsURL() bool {
	if strings.TrimSpace(r.URL) == "" {
		return false
	}
	u, err := url.Parse(r.URL)
	if err != nil {
		return false
	}
	return u.Scheme == "http" || u.Scheme == "https"
}

// HasPayload returns true if RawItem has byte content.
func (r *RawItem) HasPayload() bool {
	return len(r.Payload) > 0
}

// Reader returns an io.Reader over the Payload.
func (r *RawItem) Reader() io.Reader {
	return bytes.NewReader(r.Payload)
}
