package sqid

import (
	"errors"
	"math"
	"strings"
	"testing"
)

const testAlphabet = "k3G7QAe51FfL2rl4wRxyOzZbnucItJ8hgSpEmvNiHqKMWXdVaCDBjT0YoU6P9s"

func newCodec(t *testing.T) *Codec {
	t.Helper()

	c, err := New(testAlphabet)
	if err != nil {
		t.Fatal(err)
	}

	return c
}

func TestRoundTrip(t *testing.T) {
	c := newCodec(t)

	for _, id := range []int64{0, 1, 2, 9, 10, 99, 100, 1000, 123456, math.MaxInt32, math.MaxInt64} {
		encoded, err := c.Encode(id)
		if err != nil {
			t.Fatalf("Encode(%d): %v", id, err)
		}

		if len(encoded) < minLength {
			t.Errorf("Encode(%d) = %q, shorter than %d", id, encoded, minLength)
		}

		decoded, err := c.Decode(encoded)
		if err != nil {
			t.Fatalf("Decode(%q): %v", encoded, err)
		}

		if decoded != id {
			t.Errorf("Decode(Encode(%d)) = %d", id, decoded)
		}
	}
}

func TestDecodeRejects(t *testing.T) {
	c := newCodec(t)

	valid, err := c.Encode(42)
	if err != nil {
		t.Fatal(err)
	}

	cases := map[string]string{
		"empty":            "",
		"zero":             "0",
		"out of alphabet":  "!!!!!!",
		"padded":           valid + " ",
		"absurdly long":    strings.Repeat(testAlphabet, 100),
		"trailing garbage": valid + "zzzz",
	}

	for name, input := range cases {
		if _, err := c.Decode(input); !errors.Is(err, ErrInvalid) {
			t.Errorf("Decode(%s = %q) did not reject", name, input)
		}
	}
}

// Decode is lenient about non-canonical forms, so anything it accepts must re-encode to itself
func TestDecodeRejectsNonCanonical(t *testing.T) {
	c := newCodec(t)

	valid, err := c.Encode(7)
	if err != nil {
		t.Fatal(err)
	}

	for _, padding := range []string{testAlphabet[:1], testAlphabet[:2], testAlphabet[:3]} {
		input := padding + valid

		if input == valid {
			continue
		}

		id, err := c.Decode(input)
		if err == nil {
			t.Errorf("Decode(%q) = %d, accepted a non-canonical form of %q", input, id, valid)
		}
	}
}

func TestEncodeRejectsNegative(t *testing.T) {
	c := newCodec(t)

	if _, err := c.Encode(-1); !errors.Is(err, ErrInvalid) {
		t.Error("Encode(-1) did not reject")
	}
}

func TestNewRejectsBadAlphabet(t *testing.T) {
	for name, alphabet := range map[string]string{
		"empty":     "",
		"too short": "abc",
		"repeated":  strings.Repeat("a", 60),
	} {
		if _, err := New(alphabet); err == nil {
			t.Errorf("New(%s) accepted", name)
		}
	}
}
