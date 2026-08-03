package auth

import (
	"time"
)

// AuthMechanism specifies the authentication protocol required by a connector.
type AuthMechanism string

const (
	AuthMechanismOAuth2 AuthMechanism = "OAUTH2"
	AuthMechanismAPIKey AuthMechanism = "API_KEY"
	AuthMechanismPAT    AuthMechanism = "PERSONAL_ACCESS_TOKEN"
)

// OAuth2Data holds tokens and parameters for OAuth2 authentication.
type OAuth2Data struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token,omitempty"`
	TokenType    string    `json:"token_type,omitempty"`
	ExpiresAt    time.Time `json:"expires_at,omitempty"`
	Scopes       []string  `json:"scopes,omitempty"`
}

// APIKeyData holds credentials for API Key authentication.
type APIKeyData struct {
	Key    string `json:"key"`
	Header string `json:"header,omitempty"` // e.g. "X-API-Key" or "Authorization"
	Prefix string `json:"prefix,omitempty"` // e.g. "Bearer" or "ApiKey"
}

// PATData holds credentials for Personal Access Token authentication.
type PATData struct {
	Token    string `json:"token"`
	Username string `json:"username,omitempty"`
}

// AuthConfig encapsulates credentials for any supported authentication mechanism.
type AuthConfig struct {
	Mechanism    AuthMechanism     `json:"mechanism"`
	OAuth2       *OAuth2Data       `json:"oauth2,omitempty"`
	APIKey       *APIKeyData       `json:"api_key,omitempty"`
	PAT          *PATData          `json:"pat,omitempty"`
	CustomParams map[string]string `json:"custom_params,omitempty"`
}

// GetToken returns the primary active secret/token string regardless of mechanism.
func (c *AuthConfig) GetToken() string {
	if c == nil {
		return ""
	}
	switch c.Mechanism {
	case AuthMechanismOAuth2:
		if c.OAuth2 != nil {
			return c.OAuth2.AccessToken
		}
	case AuthMechanismAPIKey:
		if c.APIKey != nil {
			return c.APIKey.Key
		}
	case AuthMechanismPAT:
		if c.PAT != nil {
			return c.PAT.Token
		}
	}
	return ""
}

// IsExpired checks if the OAuth2 token is expired (if mechanism is OAuth2).
func (c *AuthConfig) IsExpired() bool {
	if c == nil || c.Mechanism != AuthMechanismOAuth2 || c.OAuth2 == nil {
		return false
	}
	if c.OAuth2.ExpiresAt.IsZero() {
		return false
	}
	return time.Now().After(c.OAuth2.ExpiresAt)
}
