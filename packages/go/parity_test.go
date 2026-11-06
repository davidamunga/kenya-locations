package kenyalocations_test

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	kl "github.com/davidamunga/kenya-locations/packages/go"
)

type parityCases struct {
	Lookups []struct {
		Call   string  `json:"call"`
		Arg    string  `json:"arg"`
		Expect *string `json:"expect"`
	} `json:"lookups"`
	Counts []struct {
		Call   string `json:"call"`
		Arg    string `json:"arg"`
		Expect int    `json:"expect"`
	} `json:"counts"`
	AreasInLocality []struct {
		Locality    string   `json:"locality"`
		County      *string  `json:"county"`
		Includes    []string `json:"includes"`
		ExpectCount *int     `json:"expectCount"`
	} `json:"areasInLocality"`
	LocalitiesInCounty []struct {
		County   string   `json:"county"`
		Includes []string `json:"includes"`
	} `json:"localitiesInCounty"`
	Search []struct {
		Query    string `json:"query"`
		Limit    int    `json:"limit"`
		Empty    bool   `json:"empty"`
		Includes []struct {
			Type string `json:"type"`
			Name string `json:"name"`
		} `json:"includes"`
	} `json:"search"`
	SearchByType []struct {
		Query    string   `json:"query"`
		Type     string   `json:"type"`
		Limit    int      `json:"limit"`
		NonEmpty bool     `json:"nonEmpty"`
		Includes []string `json:"includes"`
	} `json:"searchByType"`
}

func loadParityCases(t *testing.T) parityCases {
	t.Helper()
	path := filepath.Join("..", "..", "tests", "parity", "cases.json")
	raw, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		t.Skip("tests/parity/cases.json is only available in the monorepo")
	}
	if err != nil {
		t.Fatal(err)
	}
	var cases parityCases
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatalf("parsing %s: %v", path, err)
	}
	return cases
}

func assertNoMismatches(t *testing.T, mismatches []string) {
	t.Helper()
	if len(mismatches) > 0 {
		t.Errorf("parity mismatches:\n%s", strings.Join(mismatches, "\n"))
	}
}

func show(s *string) string {
	if s == nil {
		return "null"
	}
	return fmt.Sprintf("%q", *s)
}

func TestParityLookups(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).Lookups {
		var actual *string
		switch c.Call {
		case "countyByCode":
			if v := kl.GetCountyByCode(c.Arg); v != nil {
				actual = &v.Name
			}
		case "countyByName":
			if v := kl.GetCountyByName(c.Arg); v != nil {
				actual = &v.Code
			}
		case "constituencyByCode":
			if v := kl.GetConstituencyByCode(c.Arg); v != nil {
				actual = &v.Name
			}
		case "constituencyByName":
			if v := kl.GetConstituencyByName(c.Arg); v != nil {
				actual = &v.Code
			}
		default:
			t.Fatalf("unknown lookup call %q: add it to the Go harness", c.Call)
		}
		if show(actual) != show(c.Expect) {
			mismatches = append(mismatches, fmt.Sprintf("%s(%q): expected %s, got %s", c.Call, c.Arg, show(c.Expect), show(actual)))
		}
	}
	assertNoMismatches(t, mismatches)
}

func TestParityCounts(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).Counts {
		var actual int
		switch c.Call {
		case "constituenciesInCounty":
			actual = len(kl.GetConstituenciesInCounty(c.Arg))
		case "wardsInCounty":
			actual = len(kl.GetWardsInCounty(c.Arg))
		case "subCountiesInCounty":
			actual = len(kl.GetSubCountiesInCounty(c.Arg))
		case "wardsInConstituency":
			actual = len(kl.GetWardsInConstituency(c.Arg))
		default:
			t.Fatalf("unknown count call %q: add it to the Go harness", c.Call)
		}
		if actual != c.Expect {
			mismatches = append(mismatches, fmt.Sprintf("%s(%q): expected %d, got %d", c.Call, c.Arg, c.Expect, actual))
		}
	}
	assertNoMismatches(t, mismatches)
}

func TestParityAreasInLocality(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).AreasInLocality {
		var areas []kl.Area
		county := "null"
		if c.County != nil {
			county = *c.County
			areas = kl.GetAreasInLocality(c.Locality, *c.County)
		} else {
			areas = kl.GetAreasInLocality(c.Locality)
		}
		got := names(areas, func(a kl.Area) string { return a.Name })
		label := fmt.Sprintf("areasInLocality(%s, %s)", c.Locality, county)
		if c.ExpectCount != nil && len(got) != *c.ExpectCount {
			mismatches = append(mismatches, fmt.Sprintf("%s: expected %d areas, got %d", label, *c.ExpectCount, len(got)))
		}
		for _, want := range c.Includes {
			if !contains(got, want) {
				mismatches = append(mismatches, fmt.Sprintf("%s: missing %s", label, want))
			}
		}
	}
	assertNoMismatches(t, mismatches)
}

func TestParityLocalitiesInCounty(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).LocalitiesInCounty {
		got := names(kl.GetLocalitiesInCounty(c.County), func(l kl.Locality) string { return l.Name })
		for _, want := range c.Includes {
			if !contains(got, want) {
				mismatches = append(mismatches, fmt.Sprintf("localitiesInCounty(%s): missing %s", c.County, want))
			}
		}
	}
	assertNoMismatches(t, mismatches)
}

func TestParitySearch(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).Search {
		results := kl.Search(c.Query, kl.WithLimit(c.Limit))
		hits := make([]string, len(results))
		for i, r := range results {
			hits[i] = string(r.Type) + ":" + r.Name()
		}
		if c.Empty && len(results) > 0 {
			mismatches = append(mismatches, fmt.Sprintf("search(%q): expected no results, got %d", c.Query, len(results)))
		}
		for _, want := range c.Includes {
			if !contains(hits, want.Type+":"+want.Name) {
				mismatches = append(mismatches, fmt.Sprintf("search(%q): missing %s:%s; got %s", c.Query, want.Type, want.Name, strings.Join(hits, " | ")))
			}
		}
	}
	assertNoMismatches(t, mismatches)
}

func TestParitySearchByType(t *testing.T) {
	var mismatches []string
	for _, c := range loadParityCases(t).SearchByType {
		typ := kl.SearchType(c.Type)
		label := fmt.Sprintf("searchByType(%q, %s)", c.Query, c.Type)
		if !typ.Valid() {
			mismatches = append(mismatches, label+": unknown type")
			continue
		}
		results := kl.SearchByType(c.Query, typ, c.Limit)
		if c.NonEmpty && len(results) == 0 {
			mismatches = append(mismatches, label+": expected results, got none")
		}
		got := make([]string, len(results))
		for i, r := range results {
			if r.Type != typ {
				mismatches = append(mismatches, label+": returned other types")
				break
			}
			got[i] = r.Name()
		}
		for _, want := range c.Includes {
			if !contains(got, want) {
				mismatches = append(mismatches, fmt.Sprintf("%s: missing %s", label, want))
			}
		}
	}
	assertNoMismatches(t, mismatches)
}
