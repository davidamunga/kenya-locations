package kenyalocations

import (
	"sort"
	"strings"
	"sync"
	"unicode/utf8"
)

type SearchType string

const (
	SearchTypeCounty       SearchType = "county"
	SearchTypeSubCounty    SearchType = "sub-county"
	SearchTypeConstituency SearchType = "constituency"
	SearchTypeWard         SearchType = "ward"
	SearchTypeLocality     SearchType = "locality"
	SearchTypeArea         SearchType = "area"
)

func (t SearchType) Valid() bool {
	switch t {
	case SearchTypeCounty, SearchTypeSubCounty, SearchTypeConstituency,
		SearchTypeWard, SearchTypeLocality, SearchTypeArea:
		return true
	}
	return false
}

type SearchResult struct {
	Type SearchType
	Item any
}

func (r SearchResult) Name() string {
	switch item := r.Item.(type) {
	case County:
		return item.Name
	case SubCounty:
		return item.Name
	case Constituency:
		return item.Name
	case Ward:
		return item.Name
	case Locality:
		return item.Name
	case Area:
		return item.Name
	}
	return ""
}

const DefaultSearchLimit = 20

type searchConfig struct {
	limit int
	types map[SearchType]struct{}
}

type SearchOption func(*searchConfig)

func WithLimit(limit int) SearchOption {
	return func(c *searchConfig) { c.limit = limit }
}

func WithTypes(types ...SearchType) SearchOption {
	return func(c *searchConfig) {
		if len(types) == 0 {
			c.types = nil
			return
		}
		c.types = make(map[SearchType]struct{}, len(types))
		for _, t := range types {
			c.types[t] = struct{}{}
		}
	}
}

func Search(query string, opts ...SearchOption) []SearchResult {
	cfg := searchConfig{limit: DefaultSearchLimit}
	for _, opt := range opts {
		opt(&cfg)
	}

	q := strings.TrimSpace(query)
	if utf8.RuneCountInString(q) < 2 || cfg.limit <= 0 {
		return []SearchResult{}
	}

	pattern := []rune(strings.ToLower(q))
	patternString := string(pattern)
	buffer := make([]int, 0, 64)

	type scored struct {
		score float64
		entry *searchEntry
	}
	var hits []scored

	entries := searchEntries()
	for i := range entries {
		entry := &entries[i]
		if cfg.types != nil {
			if _, ok := cfg.types[entry.kind]; !ok {
				continue
			}
		}
		if score, ok := fuzzyScore(pattern, patternString, entry, &buffer); ok {
			hits = append(hits, scored{score, entry})
		}
	}

	sort.SliceStable(hits, func(a, b int) bool { return hits[a].score < hits[b].score })
	if len(hits) > cfg.limit {
		hits = hits[:cfg.limit]
	}

	d := load()
	results := make([]SearchResult, len(hits))
	for i, hit := range hits {
		results[i] = SearchResult{Type: hit.entry.kind, Item: d.itemAt(hit.entry.kind, hit.entry.index)}
	}
	return results
}

func SearchByType(query string, searchType SearchType, limit int) []SearchResult {
	return Search(query, WithLimit(limit), WithTypes(searchType))
}

type searchEntry struct {
	kind  SearchType
	index int
	text  string
	runes []rune
}

var (
	searchOnce  sync.Once
	searchIndex []searchEntry
)

func searchEntries() []searchEntry {
	searchOnce.Do(func() {
		d := load()
		total := len(d.counties) + len(d.subCounties) + len(d.constituencies) +
			len(d.wards) + len(d.localities) + len(d.areas)
		searchIndex = make([]searchEntry, 0, total)

		add := func(kind SearchType, index int, name string) {
			text := strings.ToLower(name)
			searchIndex = append(searchIndex, searchEntry{kind, index, text, []rune(text)})
		}
		for i, v := range d.counties {
			add(SearchTypeCounty, i, v.Name)
		}
		for i, v := range d.subCounties {
			add(SearchTypeSubCounty, i, v.Name)
		}
		for i, v := range d.constituencies {
			add(SearchTypeConstituency, i, v.Name)
		}
		for i, v := range d.wards {
			add(SearchTypeWard, i, v.Name)
		}
		for i, v := range d.localities {
			add(SearchTypeLocality, i, v.Name)
		}
		for i, v := range d.areas {
			add(SearchTypeArea, i, v.Name)
		}
	})
	return searchIndex
}

func (d *dataset) itemAt(kind SearchType, index int) any {
	switch kind {
	case SearchTypeCounty:
		return d.counties[index].clone()
	case SearchTypeSubCounty:
		return d.subCounties[index]
	case SearchTypeConstituency:
		return d.constituencies[index]
	case SearchTypeWard:
		return d.wards[index]
	case SearchTypeLocality:
		return d.localities[index]
	default:
		return d.areas[index]
	}
}

func fuzzyScore(pattern []rune, patternString string, entry *searchEntry, buffer *[]int) (float64, bool) {
	if strings.Contains(entry.text, patternString) {
		return 0, true
	}

	pLen := len(pattern)
	text := entry.runes
	tLen := len(text)
	if pLen < 2 || tLen == 0 {
		return 0, false
	}

	maxErrors := int(float64(pLen) * 0.4)
	if maxErrors < 1 {
		maxErrors = 1
	}
	windowSize := pLen + maxErrors
	best := -1.0

	for start := 0; start < tLen; start++ {
		end := start + windowSize
		if end > tLen {
			end = tLen
		}
		window := text[start:end]

		if diff := pLen - len(window); diff > maxErrors || -diff > maxErrors {
			continue
		}
		distance := levenshtein(pattern, window, buffer)
		if distance > maxErrors {
			continue
		}
		if score := float64(distance) / float64(pLen); best < 0 || score < best {
			best = score
		}
	}

	if best < 0 || best > 0.4 {
		return 0, false
	}
	return best, true
}

func levenshtein(a, b []rune, buffer *[]int) int {
	m, n := len(a), len(b)
	if m == 0 {
		return n
	}
	if n == 0 {
		return m
	}

	if cap(*buffer) < n+1 {
		*buffer = make([]int, n+1)
	}
	dp := (*buffer)[:n+1]
	for j := range dp {
		dp[j] = j
	}

	for i := 1; i <= m; i++ {
		previous := dp[0]
		dp[0] = i
		for j := 1; j <= n; j++ {
			current := dp[j]
			if a[i-1] == b[j-1] {
				dp[j] = previous
			} else {
				dp[j] = 1 + min3(previous, dp[j], dp[j-1])
			}
			previous = current
		}
	}
	return dp[n]
}

func min3(a, b, c int) int {
	if b < a {
		a = b
	}
	if c < a {
		a = c
	}
	return a
}
