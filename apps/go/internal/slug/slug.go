package slug

import (
	"strings"
	"unicode"
	"unicode/utf8"

	"golang.org/x/text/unicode/norm"
)

const (
	maxLength = 60
	fallback  = "product"
)

func Make(name string) string {
	b := strings.Builder{}
	dash := false

	for _, r := range norm.NFD.String(strings.ToLower(name)) {
		switch {
		case unicode.Is(unicode.Mn, r):
		case r < utf8.RuneSelf && (r >= 'a' && r <= 'z' || r >= '0' && r <= '9'):
			b.WriteRune(r)
			dash = false
		case !dash && b.Len() > 0:
			b.WriteByte('-')
			dash = true
		}
	}

	s := strings.TrimRight(b.String(), "-")

	if len(s) > maxLength {
		s = s[:maxLength]

		if i := strings.LastIndexByte(s, '-'); i > 0 {
			s = s[:i]
		}

		s = strings.TrimRight(s, "-")
	}

	if s == "" {
		return fallback
	}

	return s
}
