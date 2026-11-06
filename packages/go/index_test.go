package kenyalocations

import (
	"reflect"
	"testing"
)

func TestNormaliseCode(t *testing.T) {
	cases := []struct {
		in    string
		width int
		want  string
	}{
		{"47", 3, "047"},
		{"047", 3, "047"},
		{" 47 ", 3, "047"},
		{"1", 4, "0001"},
		{"9999", 3, "9999"},
		{"abc", 3, "abc"},
		{"4a", 3, "4a"},
		{"", 3, ""},
		{"   ", 3, ""},
	}
	for _, c := range cases {
		if got := normaliseCode(c.in, c.width); got != c.want {
			t.Errorf("normaliseCode(%q, %d) = %q, want %q", c.in, c.width, got, c.want)
		}
	}
}

func TestFold(t *testing.T) {
	cases := map[string]string{
		"Murang'a":        "muranga",
		"Elgeyo-Marakwet": "elgeyomarakwet",
		"  Homa Bay ":     "homabay",
		"Nairóbi":         "nairobi",
		"Kisumu 2":        "kisumu2",
		"'-/ ":            "",
		"":                "",
	}
	for in, want := range cases {
		if got := fold(in); got != want {
			t.Errorf("fold(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestLower(t *testing.T) {
	if got := lower("  NaIrObI "); got != "nairobi" {
		t.Errorf("lower = %q", got)
	}
}

type named struct {
	name    string
	aliases []string
}

func newTestIndex(items ...named) *nameIndex[named] {
	return newNameIndex(items, func(n named) []string { return append([]string{n.name}, n.aliases...) })
}

func TestNameIndexExactBeatsFolded(t *testing.T) {
	idx := newTestIndex(named{name: "Murang'a"}, named{name: "Muranga"})

	got, ok := idx.unique("muranga")
	if !ok || got.name != "Muranga" {
		t.Fatalf("exact match should win over folded, got %v %v", got, ok)
	}
	got, ok = idx.unique("Murang'a")
	if !ok || got.name != "Murang'a" {
		t.Fatalf("got %v %v", got, ok)
	}
}

func TestNameIndexFoldedFallback(t *testing.T) {
	idx := newTestIndex(named{name: "Murang'a"})
	if got, ok := idx.unique("MURANGA"); !ok || got.name != "Murang'a" {
		t.Fatalf("folded fallback failed: %v %v", got, ok)
	}
}

func TestNameIndexAliases(t *testing.T) {
	idx := newTestIndex(named{name: "Nairobi", aliases: []string{"Nairobi City"}})
	for _, query := range []string{"Nairobi", "nairobi city", "NairobiCity"} {
		if got, ok := idx.unique(query); !ok || got.name != "Nairobi" {
			t.Errorf("unique(%q) = %v %v", query, got, ok)
		}
	}
}

func TestNameIndexDoesNotDuplicateOneRecord(t *testing.T) {
	// A name and an alias that fold to the same key must not count twice.
	idx := newTestIndex(named{name: "Kisii", aliases: []string{"kisii", "Kis-ii"}})
	if got := idx.all("kisii"); len(got) != 1 {
		t.Fatalf("expected one match, got %d", len(got))
	}
}

func TestNameIndexAmbiguous(t *testing.T) {
	idx := newTestIndex(named{name: "Township"}, named{name: "Township"})
	if _, ok := idx.unique("Township"); ok {
		t.Fatal("ambiguous name must not resolve")
	}
	if got := idx.all("township"); len(got) != 2 {
		t.Fatalf("all() = %d matches, want 2", len(got))
	}
}

func TestNameIndexMissing(t *testing.T) {
	idx := newTestIndex(named{name: "Nairobi"})
	if got := idx.all("Atlantis"); got == nil || len(got) != 0 {
		t.Fatalf("all() should be empty and non-nil, got %#v", got)
	}
	if _, ok := idx.unique("Atlantis"); ok {
		t.Fatal("unexpected match")
	}
	if got := idx.all("'"); len(got) != 0 {
		t.Fatalf("punctuation-only query matched %v", got)
	}
}

func TestLevenshtein(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"", "", 0},
		{"abc", "", 3},
		{"", "abc", 3},
		{"kitten", "sitting", 3},
		{"nairobi", "nairbi", 1},
		{"same", "same", 0},
		{"flaw", "lawn", 2},
	}
	var buf []int
	for _, c := range cases {
		if got := levenshtein([]rune(c.a), []rune(c.b), &buf); got != c.want {
			t.Errorf("levenshtein(%q, %q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestFuzzyScore(t *testing.T) {
	entry := func(name string) *searchEntry {
		return &searchEntry{text: name, runes: []rune(name)}
	}
	score := func(pattern, text string) (float64, bool) {
		var buf []int
		return fuzzyScore([]rune(pattern), pattern, entry(text), &buf)
	}

	if s, ok := score("nairobi", "nairobi"); !ok || s != 0 {
		t.Errorf("exact: %v %v", s, ok)
	}
	if s, ok := score("kar", "karen blixen"); !ok || s != 0 {
		t.Errorf("substring: %v %v", s, ok)
	}
	if s, ok := score("nairbi", "nairobi"); !ok || !reflect.DeepEqual(s, 1.0/6.0) {
		t.Errorf("one typo: %v %v", s, ok)
	}
	if _, ok := score("zzzzzz", "nairobi"); ok {
		t.Error("unrelated text matched")
	}
	// Two-letter patterns only match as substrings.
	if _, ok := score("nx", "nairobi"); ok {
		t.Error("two-letter fuzzy match should be rejected")
	}
}
