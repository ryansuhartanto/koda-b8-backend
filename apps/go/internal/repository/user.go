package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID           int64
	PasswordHash string
}

func CreateUser(ctx context.Context, pool *pgxpool.Pool, name, email, passwordHash string) (int64, error) {
	var id int64

	err := pool.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
		name, email, passwordHash,
	).Scan(&id)

	return id, err
}

func UserByEmail(ctx context.Context, pool *pgxpool.Pool, email string) (User, error) {
	var user User

	err := pool.QueryRow(ctx,
		`SELECT id, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL`,
		email,
	).Scan(&user.ID, &user.PasswordHash)

	return user, err
}
