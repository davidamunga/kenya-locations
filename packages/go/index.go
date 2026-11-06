package kenyalocations

import (
	"strings"
)

type nameIndex[T any] struct {
	items  []T
	exact  map[string][]int
	folded map[string][]int
}

func newNameIndex[T any](items []T, names func(T) []string) *nameIndex[T] {
	idx := &nameIndex[T]{
		items:  items,
		exact:  make(map[string][]int, len(items)),
		folded: make(map[string][]int, len(items)),
	}
	for i, item := range items {
		seenExact := map[string]struct{}{}
		seenFolded := map[string]struct{}{}
		for _, name := range names(item) {
			if key := lower(name); !has(seenExact, key) {
				seenExact[key] = struct{}{}
				idx.exact[key] = append(idx.exact[key], i)
			}
			if key := fold(name); !has(seenFolded, key) {
				seenFolded[key] = struct{}{}
				idx.folded[key] = append(idx.folded[key], i)
			}
		}
	}
	return idx
}

func has(set map[string]struct{}, key string) bool {
	_, ok := set[key]
	return ok
}

func (n *nameIndex[T]) all(name string) []T {
	indexes, ok := n.exact[lower(name)]
	if !ok {
		indexes = n.folded[fold(name)]
	}
	out := make([]T, 0, len(indexes))
	for _, i := range indexes {
		out = append(out, n.items[i])
	}
	return out
}

func (n *nameIndex[T]) unique(name string) (T, bool) {
	matches := n.all(name)
	if len(matches) == 1 {
		return matches[0], true
	}
	var zero T
	return zero, false
}

func lower(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func fold(value string) string {
	var b strings.Builder
	b.Grow(len(value))
	for _, r := range strings.ToLower(value) {
		if mapped, ok := accents[r]; ok {
			r = mapped
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

var accents = func() map[rune]rune {
	groups := map[rune]string{
		'a': "àáâãäåāăą",
		'c': "çćĉċč",
		'd': "ď",
		'e': "èéêëēĕėęě",
		'g': "ĝğġģ",
		'h': "ĥ",
		'i': "ìíîïĩīĭįǐ",
		'j': "ĵ",
		'k': "ķ",
		'l': "ĺļľ",
		'n': "ñńņň",
		'o': "òóôõöōŏőǒ",
		'r': "ŕŗř",
		's': "śŝşš",
		't': "ţť",
		'u': "ùúûüũūŭůűųǔ",
		'w': "ŵ",
		'y': "ýÿŷ",
		'z': "źżž",
	}
	m := map[rune]rune{}
	for base, chars := range groups {
		for _, c := range chars {
			m[c] = base
		}
	}
	return m
}()

func normaliseCode(value string, width int) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return trimmed
	}
	for _, r := range trimmed {
		if r < '0' || r > '9' {
			return trimmed
		}
	}
	if n := len(trimmed); n < width {
		return strings.Repeat("0", width-n) + trimmed
	}
	return trimmed
}
