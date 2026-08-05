package sqid

import (
	"errors"
	"math"

	sqids "github.com/sqids/sqids-go"
)

const (
	minLength   = 6
	minAlphabet = 16
)

var (
	ErrInvalid  = errors.New("invalid sqid")
	ErrAlphabet = errors.New("sqid alphabet must be at least 16 characters")
)

type Codec struct {
	sqids *sqids.Sqids
}

func New(alphabet string) (*Codec, error) {
	if len(alphabet) < minAlphabet {
		return nil, ErrAlphabet
	}

	s, err := sqids.New(sqids.Options{Alphabet: alphabet, MinLength: minLength})
	if err != nil {
		return nil, err
	}

	return &Codec{sqids: s}, nil
}

func (c *Codec) Encode(id int64) (string, error) {
	if id < 0 {
		return "", ErrInvalid
	}

	return c.sqids.Encode([]uint64{uint64(id)})
}

func (c *Codec) Decode(s string) (int64, error) {
	ids := c.sqids.Decode(s)
	if len(ids) != 1 || ids[0] > math.MaxInt64 {
		return 0, ErrInvalid
	}

	canonical, err := c.sqids.Encode(ids)
	if err != nil || canonical != s {
		return 0, ErrInvalid
	}

	return int64(ids[0]), nil
}
