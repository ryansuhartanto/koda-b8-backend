package slug

import (
	"encoding/json"
	"os"
	"testing"
)

func TestMakeMatchesFixtures(t *testing.T) {
	raw, err := os.ReadFile("../../../slug-fixtures.json")
	if err != nil {
		t.Fatal(err)
	}

	fixtures := []struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}{}
	if err := json.Unmarshal(raw, &fixtures); err != nil {
		t.Fatal(err)
	}

	for _, f := range fixtures {
		if got := Make(f.Name); got != f.Slug {
			t.Errorf("Make(%q) = %q, want %q", f.Name, got, f.Slug)
		}
	}
}

func TestMakeNeverEmptyOrEdged(t *testing.T) {
	for _, name := range []string{"", "---", "  ", "!!!", "🎉", "-a-", "Ω"} {
		got := Make(name)

		if got == "" {
			t.Errorf("Make(%q) is empty", name)
		}

		if got[0] == '-' || got[len(got)-1] == '-' {
			t.Errorf("Make(%q) = %q, has a leading or trailing dash", name, got)
		}
	}
}

func TestMakeTruncatesOnWordBoundary(t *testing.T) {
	got := Make("Kaos Polos Hitam Premium Cotton Combed 30s Unisex Lengan Pendek Original")

	if len(got) > maxLength {
		t.Errorf("Make() = %q, length %d exceeds %d", got, len(got), maxLength)
	}

	if got[len(got)-1] == '-' {
		t.Errorf("Make() = %q, truncated onto a dash", got)
	}
}
