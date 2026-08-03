package tokenstore

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"linkaroo-app/server/pkg/connector/auth"
)

var (
	ErrInvalidKeySize = errors.New("encryption key must be exactly 32 bytes for AES-256")
)

// EncryptedTokenStore wraps a TokenStore and encrypts TokenRecord AuthConfig payloads at rest using AES-256-GCM.
type EncryptedTokenStore struct {
	underlying TokenStore
	secretKey  []byte
}

// NewEncryptedTokenStore creates an EncryptedTokenStore wrapper around a base TokenStore.
func NewEncryptedTokenStore(underlying TokenStore, secretKey []byte) (*EncryptedTokenStore, error) {
	if len(secretKey) != 32 {
		return nil, ErrInvalidKeySize
	}
	return &EncryptedTokenStore{
		underlying: underlying,
		secretKey:  secretKey,
	}, nil
}

func (e *EncryptedTokenStore) SaveToken(ctx context.Context, connectorID string, record *TokenRecord) error {
	if record == nil {
		return errors.New("cannot save nil token record")
	}

	// Clone record to avoid mutating caller's in-memory struct
	cloned := *record
	if record.AuthConfig != nil {
		data, err := json.Marshal(record.AuthConfig)
		if err != nil {
			return fmt.Errorf("failed to marshal auth config for encryption: %w", err)
		}
		encryptedData, err := e.encrypt(data)
		if err != nil {
			return fmt.Errorf("failed to encrypt auth config: %w", err)
		}
		if cloned.Metadata == nil {
			cloned.Metadata = make(map[string]string)
		}
		cloned.Metadata["_encrypted_auth_config"] = string(encryptedData)
	}

	return e.underlying.SaveToken(ctx, connectorID, &cloned)
}

func (e *EncryptedTokenStore) GetToken(ctx context.Context, connectorID string) (*TokenRecord, error) {
	record, err := e.underlying.GetToken(ctx, connectorID)
	if err != nil {
		return nil, err
	}

	if record.Metadata != nil {
		if encVal, ok := record.Metadata["_encrypted_auth_config"]; ok {
			decryptedBytes, err := e.decrypt([]byte(encVal))
			if err != nil {
				return nil, fmt.Errorf("failed to decrypt auth config: %w", err)
			}
			var authCfg auth.AuthConfig
			if err := json.Unmarshal(decryptedBytes, &authCfg); err != nil {
				return nil, fmt.Errorf("failed to unmarshal decrypted auth config: %w", err)
			}
			record.AuthConfig = &authCfg
		}
	}

	return record, nil
}

func (e *EncryptedTokenStore) DeleteToken(ctx context.Context, connectorID string) error {
	return e.underlying.DeleteToken(ctx, connectorID)
}

func (e *EncryptedTokenStore) ListTokens(ctx context.Context) ([]*TokenRecord, error) {
	records, err := e.underlying.ListTokens(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*TokenRecord, len(records))
	for i, r := range records {
		dec, err := e.GetToken(ctx, r.ConnectorID)
		if err != nil {
			result[i] = r
		} else {
			result[i] = dec
		}
	}
	return result, nil
}

func (e *EncryptedTokenStore) encrypt(plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(e.secretKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

func (e *EncryptedTokenStore) decrypt(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(e.secretKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}
