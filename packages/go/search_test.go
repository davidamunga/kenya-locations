package kenyalocations_test

import (
	"testing"

	kl "github.com/davidamunga/kenya-locations/packages/go"
)

func hasResult(results []kl.SearchResult, typ kl.SearchType, name string) bool {
	for _, r := range results {
		if r.Type == typ && r.Name() == name {
			return true
		}
	}
	return false
}

func TestSearchExact(t *testing.T) {
	results := kl.Search("Nairobi", kl.WithLimit(10))
	if !hasResult(results, kl.SearchTypeCounty, "Nairobi") {
		t.Fatalf("Nairobi county missing from %d results", len(results))
	}
	if kl.Search("nairobi", kl.WithLimit(10))[0].Name() != results[0].Name() {
		t.Error("search should be case-insensitive")
	}
}

func TestSearchTypoTolerance(t *testing.T) {
	cases := map[string]string{
		"Nairbi":   "Nairobi",
		"Mombassa": "Mombasa",
		"Kisumo":   "Kisumu",
		"Kakamga":  "Kakamega",
	}
	for query, want := range cases {
		if !hasResult(kl.Search(query, kl.WithLimit(10)), kl.SearchTypeCounty, want) {
			t.Errorf("Search(%q) did not find county %s", query, want)
		}
	}
}

func TestSearchRanksExactMatchesFirst(t *testing.T) {
	
	results := kl.Search("Westlands", kl.WithLimit(200))
	if !hasResult(results, kl.SearchTypeConstituency, "Westlands") ||
		!hasResult(results, kl.SearchTypeLocality, "Westlands") {
		t.Fatal("expected the Westlands constituency and locality")
	}
	seenFuzzy := false
	for _, r := range results {
		if !indexFold(r.Name(), "westlands") {
			seenFuzzy = true
		} else if seenFuzzy {
			t.Fatalf("substring match %q ranked after a fuzzy match", r.Name())
		}
	}
}

func indexFold(s, sub string) bool {
	ls, lsub := []rune(s), []rune(sub)
	for i := 0; i+len(lsub) <= len(ls); i++ {
		match := true
		for j := range lsub {
			a, b := ls[i+j], lsub[j]
			if a >= 'A' && a <= 'Z' {
				a += 'a' - 'A'
			}
			if a != b {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func TestSearchKwaJose(t *testing.T) {
	if !hasResult(kl.Search("Kwa Jose", kl.WithLimit(5)), kl.SearchTypeArea, "Kwa Jose") {
		t.Error("Kwa Jose area not in top 5")
	}
}

func TestSearchShortAndBlankQueries(t *testing.T) {
	for _, query := range []string{"", " ", "  ", "a", " a "} {
		got := kl.Search(query)
		if got == nil || len(got) != 0 {
			t.Errorf("Search(%q) = %v, want empty non-nil", query, got)
		}
	}
}

func TestSearchLimit(t *testing.T) {
	if got := len(kl.Search("a1", kl.WithLimit(0))); got != 0 {
		t.Errorf("limit 0 returned %d", got)
	}
	if got := len(kl.Search("nai", kl.WithLimit(-3))); got != 0 {
		t.Errorf("negative limit returned %d", got)
	}
	if got := len(kl.Search("kar", kl.WithLimit(3))); got != 3 {
		t.Errorf("limit 3 returned %d", got)
	}
	if got := len(kl.Search("kar")); got > kl.DefaultSearchLimit {
		t.Errorf("default limit exceeded: %d", got)
	}
	if kl.DefaultSearchLimit != 20 {
		t.Errorf("DefaultSearchLimit = %d, want 20", kl.DefaultSearchLimit)
	}
}

func TestSearchTypeFilter(t *testing.T) {
	results := kl.Search("kar", kl.WithLimit(50), kl.WithTypes(kl.SearchTypeLocality, kl.SearchTypeArea))
	if len(results) == 0 {
		t.Fatal("no results")
	}
	for _, r := range results {
		if r.Type != kl.SearchTypeLocality && r.Type != kl.SearchTypeArea {
			t.Errorf("unexpected type %s", r.Type)
		}
	}
	
	if got := kl.Search("Nairobi", kl.WithTypes()); !hasResult(got, kl.SearchTypeCounty, "Nairobi") {
		t.Error("WithTypes() with no arguments should search everything")
	}
}

func TestSearchByType(t *testing.T) {
	counties := kl.SearchByType("Nairobi", kl.SearchTypeCounty, 5)
	if !hasResult(counties, kl.SearchTypeCounty, "Nairobi") {
		t.Error("Nairobi county missing")
	}
	for _, r := range counties {
		if r.Type != kl.SearchTypeCounty {
			t.Errorf("returned %s", r.Type)
		}
	}
	if len(kl.SearchByType("West", kl.SearchTypeWard, 5)) == 0 {
		t.Error("expected ward results for West")
	}
	if !hasResult(kl.SearchByType("Kwa Jose", kl.SearchTypeArea, 5), kl.SearchTypeArea, "Kwa Jose") {
		t.Error("Kwa Jose area missing")
	}
	if got := kl.SearchByType("Nairobi", kl.SearchType("galaxy"), 5); len(got) != 0 {
		t.Errorf("unknown type returned %d results", len(got))
	}
}

func TestSearchResultItemsMatchTheirType(t *testing.T) {
	for _, r := range kl.Search("an", kl.WithLimit(400)) {
		ok := false
		switch r.Type {
		case kl.SearchTypeCounty:
			_, ok = r.Item.(kl.County)
		case kl.SearchTypeSubCounty:
			_, ok = r.Item.(kl.SubCounty)
		case kl.SearchTypeConstituency:
			_, ok = r.Item.(kl.Constituency)
		case kl.SearchTypeWard:
			_, ok = r.Item.(kl.Ward)
		case kl.SearchTypeLocality:
			_, ok = r.Item.(kl.Locality)
		case kl.SearchTypeArea:
			_, ok = r.Item.(kl.Area)
		}
		if !ok {
			t.Fatalf("type %s carries %T", r.Type, r.Item)
		}
		if r.Name() == "" {
			t.Fatalf("empty name for %T", r.Item)
		}
	}
}

func TestSearchTypeSwitchGivesAccessToFields(t *testing.T) {
	for _, r := range kl.Search("Nairobi", kl.WithTypes(kl.SearchTypeCounty), kl.WithLimit(1)) {
		county, ok := r.Item.(kl.County)
		if !ok || county.Capital != "Nairobi" {
			t.Errorf("got %#v", r.Item)
		}
	}
}

func TestSearchIsDeterministic(t *testing.T) {
	a := kl.Search("kisu", kl.WithLimit(30))
	b := kl.Search("kisu", kl.WithLimit(30))
	if len(a) != len(b) {
		t.Fatal("different lengths")
	}
	for i := range a {
		if a[i].Type != b[i].Type || a[i].Name() != b[i].Name() {
			t.Fatalf("order differs at %d: %s vs %s", i, a[i].Name(), b[i].Name())
		}
	}
}

func TestSearchTypeValid(t *testing.T) {
	for _, typ := range []kl.SearchType{
		kl.SearchTypeCounty, kl.SearchTypeSubCounty, kl.SearchTypeConstituency,
		kl.SearchTypeWard, kl.SearchTypeLocality, kl.SearchTypeArea,
	} {
		if !typ.Valid() {
			t.Errorf("%q should be valid", typ)
		}
	}
	if kl.SearchType("galaxy").Valid() || kl.SearchType("").Valid() {
		t.Error("unknown types must be invalid")
	}
	if kl.SearchTypeSubCounty != "sub-county" {
		t.Errorf("sub-county type = %q, want the shared value", kl.SearchTypeSubCounty)
	}
}

func BenchmarkSearch(b *testing.B) {
	kl.Search("nairobi") 
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		kl.Search("kasarani")
	}
}
