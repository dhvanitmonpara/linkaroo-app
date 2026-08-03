package auth

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrMissingAuthConfig   = errors.New("authentication configuration is missing")
	ErrUnsupportedAuthMech = errors.New("unsupported authentication mechanism")
	ErrMissingOAuth2Data   = errors.New("oauth2 data is required for OAUTH2 mechanism")
	ErrMissingAccessToken  = errors.New("access token is required for OAUTH2 mechanism")
	ErrMissingAPIKeyData   = errors.New("api key data is required for API_KEY mechanism")
	ErrMissingAPIKey       = errors.New("api key string is required for API_KEY mechanism")
	ErrMissingPATData      = errors.New("pat data is required for PERSONAL_ACCESS_TOKEN mechanism")
	ErrMissingPATToken     = errors.New("personal access token string is required for PAT mechanism")
)

// ValidateAuthConfig checks whether the given AuthConfig meets structural requirements.
func ValidateAuthConfig(cfg *AuthConfig, allowedMechanisms ...AuthMechanism) error {
	if cfg == nil {
		return ErrMissingAuthConfig
	}

	if len(allowedMechanisms) > 0 {
		allowed := false
		for _, m := range allowedMechanisms {
			if cfg.Mechanism == m {
				allowed = true
				break
			}
		}
		if !allowed {
			return fmt.Errorf("%w: %s (connector expects one of %v)", ErrUnsupportedAuthMech, cfg.Mechanism, allowedMechanisms)
		}
	}

	switch cfg.Mechanism {
	case AuthMechanismOAuth2:
		if cfg.OAuth2 == nil {
			return ErrMissingOAuth2Data
		}
		if strings.TrimSpace(cfg.OAuth2.AccessToken) == "" {
			return ErrMissingAccessToken
		}
	case AuthMechanismAPIKey:
		if cfg.APIKey == nil {
			return ErrMissingAPIKeyData
		}
		if strings.TrimSpace(cfg.APIKey.Key) == "" {
			return ErrMissingAPIKey
		}
	case AuthMechanismPAT:
		if cfg.PAT == nil {
			return ErrMissingPATData
		}
		if strings.TrimSpace(cfg.PAT.Token) == "" {
			return ErrMissingPATToken
		}
	default:
		return fmt.Errorf("%w: %s", ErrUnsupportedAuthMech, cfg.Mechanism)
	}

	return nil
}
