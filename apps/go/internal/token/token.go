package token

import (
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const TTL = 24 * time.Hour

func secret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

func Sign(idUser int64) (string, error) {
	now := time.Now()

	return jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(idUser, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(TTL)),
	}).SignedString(secret())
}

func Parse(raw string) (int64, error) {
	claims := &jwt.RegisteredClaims{}

	_, err := jwt.ParseWithClaims(raw, claims, func(*jwt.Token) (any, error) {
		return secret(), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()})) // reject algorithm confusion
	if err != nil {
		return 0, err
	}

	return strconv.ParseInt(claims.Subject, 10, 64)
}
