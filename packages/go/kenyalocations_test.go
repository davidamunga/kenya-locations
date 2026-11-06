package kenyalocations_test

import (
	"sync"
	"testing"

	kl "github.com/davidamunga/kenya-locations/packages/go"
)

func names[T any](items []T, name func(T) string) []string {
	out := make([]string, len(items))
	for i, item := range items {
		out[i] = name(item)
	}
	return out
}

func contains(haystack []string, needle string) bool {
	for _, s := range haystack {
		if s == needle {
			return true
		}
	}
	return false
}

func TestDatasetCounts(t *testing.T) {

	if got := len(kl.GetCounties()); got != 47 {
		t.Errorf("counties = %d, want 47", got)
	}
	if got := len(kl.GetConstituencies()); got != 290 {
		t.Errorf("constituencies = %d, want 290", got)
	}
	if got := len(kl.GetWards()); got != 1450 {
		t.Errorf("wards = %d, want 1450", got)
	}
	if len(kl.GetSubCounties()) == 0 || len(kl.GetLocalities()) == 0 || len(kl.GetAreas()) == 0 {
		t.Error("sub-counties, localities and areas must not be empty")
	}
}

func TestEveryRecordLinksToItsParents(t *testing.T) {
	for _, c := range kl.GetConstituencies() {
		if kl.GetCountyByCode(c.CountyCode) == nil {
			t.Errorf("constituency %s has unknown county %s", c.Name, c.CountyCode)
		}
	}
	for _, s := range kl.GetSubCounties() {
		if kl.GetCountyByCode(s.CountyCode) == nil {
			t.Errorf("sub-county %s has unknown county %s", s.Name, s.CountyCode)
		}
	}
	for _, w := range kl.GetWards() {
		if kl.GetConstituencyOfWard(w.Code) == nil {
			t.Errorf("ward %s (%s) has no constituency", w.Name, w.Code)
		}
		if kl.GetSubCountyOfWard(w.Code) == nil {
			t.Errorf("ward %s (%s) has no sub-county", w.Name, w.Code)
		}
		if kl.GetCountyOfWard(w.Code) == nil {
			t.Errorf("ward %s (%s) has no county", w.Name, w.Code)
		}
	}
	for _, l := range kl.GetLocalities() {
		if kl.GetCountyByCode(l.CountyCode) == nil {
			t.Errorf("locality %s has unknown county %s", l.Name, l.CountyCode)
		}
	}
	for _, a := range kl.GetAreas() {
		if kl.GetLocality(a.Locality, a.CountyCode) == nil {
			t.Errorf("area %s has no locality %q in county %s", a.Name, a.Locality, a.CountyCode)
		}
	}
}

func TestEveryWardIsInExactlyOneConstituencyList(t *testing.T) {
	total := 0
	for _, c := range kl.GetConstituencies() {
		total += len(kl.GetWardsInConstituency(c.Code))
	}
	if total != len(kl.GetWards()) {
		t.Errorf("wards across constituencies = %d, want %d", total, len(kl.GetWards()))
	}
}

func TestCountyMetadata(t *testing.T) {
	nairobi := kl.GetCountyByCode("047")
	if nairobi == nil {
		t.Fatal("Nairobi not found")
	}
	if nairobi.Name != "Nairobi" || nairobi.Capital != "Nairobi" || nairobi.Region != "Nairobi" ||
		nairobi.PostalCode != "00100" || nairobi.ISOCode != "KE-30" ||
		nairobi.Population2019 != 4397073 || nairobi.AreaKm2 != 694.9 {
		t.Errorf("unexpected metadata: %+v", *nairobi)
	}
	if len(nairobi.Aliases) != 1 || nairobi.Aliases[0] != "Nairobi City" {
		t.Errorf("aliases = %v", nairobi.Aliases)
	}
}

func TestCountyByCode(t *testing.T) {
	for _, code := range []string{"47", "047", " 047 "} {
		if c := kl.GetCountyByCode(code); c == nil || c.Name != "Nairobi" {
			t.Errorf("GetCountyByCode(%q) = %v", code, c)
		}
	}
	for _, code := range []string{"999", "abc", "", "0"} {
		if c := kl.GetCountyByCode(code); c != nil {
			t.Errorf("GetCountyByCode(%q) = %v, want nil", code, c)
		}
	}
}

func TestCountyByName(t *testing.T) {
	cases := map[string]string{
		"nairobi":         "047",
		" NAIROBI ":       "047",
		"Nairobi City":    "047",
		"Muranga":         "021",
		"Murang'a":        "021",
		"Elgeyo Marakwet": "028",
		"homabay":         "043",
	}
	for name, code := range cases {
		if c := kl.GetCountyByName(name); c == nil || c.Code != code {
			t.Errorf("GetCountyByName(%q) = %v, want code %s", name, c, code)
		}
	}
	if c := kl.GetCountyByName("Atlantis"); c != nil {
		t.Errorf("Atlantis = %v", c)
	}
}

func TestCountyRegions(t *testing.T) {
	valid := map[string]bool{
		"Nairobi": true, "Central": true, "Coast": true, "Eastern": true,
		"North Eastern": true, "Nyanza": true, "Rift Valley": true, "Western": true,
	}
	for _, c := range kl.GetCounties() {
		if !valid[c.Region] {
			t.Errorf("%s has unknown region %q", c.Name, c.Region)
		}
	}
}

func TestConstituencyLookups(t *testing.T) {
	if c := kl.GetConstituencyByCode("1"); c == nil || c.Name != "Changamwe" {
		t.Errorf("by short code: %v", c)
	}
	if c := kl.GetConstituencyByCode("001"); c == nil || c.Name != "Changamwe" {
		t.Errorf("by code: %v", c)
	}
	if c := kl.GetConstituencyByCode("9999"); c != nil {
		t.Errorf("unknown code: %v", c)
	}
	if c := kl.GetConstituencyByName("westlands"); c == nil || c.Code != "274" {
		t.Errorf("by name: %v", c)
	}
	if c := kl.GetConstituencyByName("Atlantis"); c != nil {
		t.Errorf("unknown name: %v", c)
	}
}

func TestRelationsInCounty(t *testing.T) {
	for _, arg := range []string{"Nairobi", "047", "47", "nairobi city"} {
		if got := len(kl.GetConstituenciesInCounty(arg)); got != 17 {
			t.Errorf("GetConstituenciesInCounty(%q) = %d, want 17", arg, got)
		}
	}
	for _, arg := range []string{"Nairobi", "47"} {
		if got := len(kl.GetWardsInCounty(arg)); got != 85 {
			t.Errorf("GetWardsInCounty(%q) = %d, want 85", arg, got)
		}
	}
	if got := len(kl.GetSubCountiesInCounty("Nairobi")); got != 17 {
		t.Errorf("GetSubCountiesInCounty = %d, want 17", got)
	}
	if got := len(kl.GetWardsInConstituency("Westlands")); got != 5 {
		t.Errorf("GetWardsInConstituency(Westlands) = %d, want 5", got)
	}
	if got := len(kl.GetWardsInConstituency("274")); got != 5 {
		t.Errorf("GetWardsInConstituency(274) = %d, want 5", got)
	}
}

func TestUnknownParentsGiveEmptyNonNilSlices(t *testing.T) {
	results := map[string]bool{
		"constituencies": kl.GetConstituenciesInCounty("Atlantis") != nil,
		"sub-counties":   kl.GetSubCountiesInCounty("Atlantis") != nil,
		"wards/county":   kl.GetWardsInCounty("Atlantis") != nil,
		"wards/const":    kl.GetWardsInConstituency("Atlantis") != nil,
		"wards/sub":      kl.GetWardsInSubCounty("Atlantis") != nil,
		"localities":     kl.GetLocalitiesInCounty("Atlantis") != nil,
		"areas/county":   kl.GetAreasInCounty("Atlantis") != nil,
		"areas/locality": kl.GetAreasInLocality("Atlantis") != nil,
		"wards by name":  kl.GetWardsByName("Atlantis") != nil,
		"localities nm":  kl.GetLocalitiesByName("Atlantis") != nil,
		"areas by name":  kl.GetAreasByName("Atlantis") != nil,
	}
	for what, nonNil := range results {
		if !nonNil {
			t.Errorf("%s returned a nil slice", what)
		}
	}
	if len(kl.GetWardsInCounty("Atlantis")) != 0 {
		t.Error("expected no wards")
	}
}

func TestWardLookups(t *testing.T) {
	ward := kl.GetWardByCode("1370")
	if ward == nil || ward.Name != "Mountain view" || ward.ConstituencyCode != "274" {
		t.Fatalf("GetWardByCode(1370) = %v", ward)
	}
	if w := kl.GetWardByCode("0721"); w == nil || w.Name != "Ainabkoi/Olare" {
		t.Errorf("padded code: %v", w)
	}
	if w := kl.GetWardByCode("721"); w == nil || w.Name != "Ainabkoi/Olare" {
		t.Errorf("unpadded code: %v", w)
	}
	if w := kl.GetWardByName("mountain VIEW"); w == nil || w.Code != "1370" {
		t.Errorf("by name: %v", w)
	}
	if w := kl.GetWardByCode("99999"); w != nil {
		t.Errorf("unknown code: %v", w)
	}
}

func TestAmbiguousWardName(t *testing.T) {
	if w := kl.GetWardByName("Township"); w != nil {
		t.Errorf("GetWardByName(Township) = %v, want nil", w)
	}
	if got := kl.GetWardsByName("Township"); len(got) < 2 {
		t.Errorf("GetWardsByName(Township) = %d wards, want several", len(got))
	}
}

func TestWardUpwardTraversal(t *testing.T) {
	for _, arg := range []string{"1370", "Mountain view"} {
		if c := kl.GetConstituencyOfWard(arg); c == nil || c.Name != "Westlands" {
			t.Errorf("GetConstituencyOfWard(%q) = %v", arg, c)
		}
		if c := kl.GetCountyOfWard(arg); c == nil || c.Name != "Nairobi" {
			t.Errorf("GetCountyOfWard(%q) = %v", arg, c)
		}
		if s := kl.GetSubCountyOfWard(arg); s == nil || s.CountyCode != "047" {
			t.Errorf("GetSubCountyOfWard(%q) = %v", arg, s)
		}
	}
	if c := kl.GetConstituencyOfWard("Township"); c != nil {
		t.Errorf("ambiguous ward resolved to %v", c)
	}
	if c := kl.GetConstituencyOfWard("Atlantis"); c != nil {
		t.Errorf("unknown ward resolved to %v", c)
	}
}

func TestSubCounties(t *testing.T) {
	first := kl.GetSubCounties()[0]
	if s := kl.GetSubCountyByCode(first.Code); s == nil || s.Name != first.Name {
		t.Errorf("by code: %v", s)
	}
	if s := kl.GetSubCountyByCode("0"); s != nil {
		t.Errorf("unknown code: %v", s)
	}
	if c := kl.GetCountyOfSubCounty(first.Code); c == nil || c.Code != first.CountyCode {
		t.Errorf("county of sub-county: %v", c)
	}
	for _, w := range kl.GetWardsInSubCounty(first.Code) {
		if w.SubCountyCode != first.Code {
			t.Errorf("ward %s is in %s, not %s", w.Name, w.SubCountyCode, first.Code)
		}
	}
	if len(kl.GetWardsInSubCounty(first.Name)) == 0 && kl.GetSubCountyByName(first.Name) != nil {
		t.Errorf("no wards for unique sub-county %s", first.Name)
	}
}

func TestCountyOfConstituency(t *testing.T) {
	if c := kl.GetCountyOfConstituency("Westlands"); c == nil || c.Name != "Nairobi" {
		t.Errorf("by name: %v", c)
	}
	if c := kl.GetCountyOfConstituency("274"); c == nil || c.Name != "Nairobi" {
		t.Errorf("by code: %v", c)
	}
}

func TestLocalitiesInCounty(t *testing.T) {
	got := names(kl.GetLocalitiesInCounty("Kiambu"), func(l kl.Locality) string { return l.Name })
	for _, want := range []string{"Juja", "Thika"} {
		if !contains(got, want) {
			t.Errorf("Kiambu localities missing %s", want)
		}
	}
	if len(kl.GetLocalitiesInCounty("022")) != len(got) {
		t.Error("name and code should give the same localities")
	}
}

func TestAmbiguousLocality(t *testing.T) {
	if l := kl.GetLocalityByName("Makadara"); l != nil {
		t.Errorf("Makadara is in several counties, got %v", l)
	}
	if got := kl.GetLocalitiesByName("Makadara"); len(got) < 2 {
		t.Errorf("GetLocalitiesByName(Makadara) = %d, want several", len(got))
	}
	if l := kl.GetLocality("Makadara", "Nairobi"); l == nil || l.CountyCode != "047" {
		t.Errorf("scoped by name: %v", l)
	}
	if l := kl.GetLocality("Makadara", "047"); l == nil || l.County != "Nairobi" {
		t.Errorf("scoped by code: %v", l)
	}
	if l := kl.GetLocality("Makadara", "Kiambu"); l != nil {
		t.Errorf("wrong county: %v", l)
	}
	if l := kl.GetLocality("Makadara", "Atlantis"); l != nil {
		t.Errorf("unknown county: %v", l)
	}
	if l := kl.GetLocalityByName("westlands"); l == nil || l.County != "Nairobi" {
		t.Errorf("unique locality: %v", l)
	}
}

func TestAreasInLocality(t *testing.T) {
	juja := names(kl.GetAreasInLocality("Juja", "Kiambu"), func(a kl.Area) string { return a.Name })
	for _, want := range []string{"Gachororo", "Gate B", "Murera", "Witethie"} {
		if !contains(juja, want) {
			t.Errorf("Juja areas missing %s", want)
		}
	}
	unscoped := names(kl.GetAreasInLocality("Juja"), func(a kl.Area) string { return a.Name })
	if len(unscoped) != len(juja) {
		t.Errorf("unique locality: scoped %d vs unscoped %d", len(juja), len(unscoped))
	}
	if got := kl.GetAreasInLocality("Juja", "Mombasa"); len(got) != 0 {
		t.Errorf("Juja in Mombasa: %v", got)
	}
	// A reused locality name needs a county.
	if got := kl.GetAreasInLocality("Makadara"); len(got) != 0 {
		t.Errorf("ambiguous locality returned %d areas", len(got))
	}
	for _, a := range kl.GetAreasInLocality("Bura", "Tana River") {
		if a.County != "Tana River" {
			t.Errorf("area %s is in %s, not Tana River", a.Name, a.County)
		}
	}
}

func TestAreaLookups(t *testing.T) {
	if a := kl.GetAreaByName("Kwa Jose"); a == nil || a.Locality != "Juja" || a.County != "Kiambu" {
		t.Errorf("Kwa Jose = %v", a)
	}
	if a := kl.GetAreaByName("Kaptagat"); a != nil {
		t.Errorf("Kaptagat is reused, got %v", a)
	}
	if got := kl.GetAreasByName("Kaptagat"); len(got) < 2 {
		t.Errorf("GetAreasByName(Kaptagat) = %d, want several", len(got))
	}
	if got := len(kl.GetAreasInCounty("Nairobi")); got == 0 {
		t.Error("Nairobi has no areas")
	}
	for _, a := range kl.GetAreasInCounty("047") {
		if a.CountyCode != "047" {
			t.Fatalf("area %s is in county %s", a.Name, a.CountyCode)
		}
	}
}

func TestAreaAndLocalityUpwardTraversal(t *testing.T) {
	if l := kl.GetLocalityOfArea("Kwa Jose"); l == nil || l.Name != "Juja" || l.CountyCode != "022" {
		t.Errorf("GetLocalityOfArea = %v", l)
	}
	if c := kl.GetCountyOfArea("Kwa Jose"); c == nil || c.Name != "Kiambu" {
		t.Errorf("GetCountyOfArea = %v", c)
	}
	if c := kl.GetCountyOfLocality("Juja"); c == nil || c.Name != "Kiambu" {
		t.Errorf("GetCountyOfLocality = %v", c)
	}
	if c := kl.GetCountyOfLocality("Makadara"); c != nil {
		t.Errorf("ambiguous locality resolved to %v", c)
	}
	if l := kl.GetLocalityOfArea("Kaptagat"); l != nil {
		t.Errorf("ambiguous area resolved to %v", l)
	}
	if c := kl.GetCountyOfArea("Atlantis"); c != nil {
		t.Errorf("unknown area resolved to %v", c)
	}
}

func TestReturnedValuesAreCopies(t *testing.T) {
	counties := kl.GetCounties()
	counties[0].Name = "Changed"
	counties[0].Aliases = append(counties[0].Aliases, "Mutated")
	if kl.GetCounties()[0].Name == "Changed" {
		t.Error("mutating GetCounties() result changed the dataset")
	}

	nairobi := kl.GetCountyByName("Nairobi")
	nairobi.Aliases[0] = "Hacked"
	if again := kl.GetCountyByName("Nairobi"); again.Aliases[0] != "Nairobi City" {
		t.Errorf("mutating a county's aliases changed the dataset: %v", again.Aliases)
	}
	if kl.GetCountyByName("Hacked") != nil {
		t.Error("mutated alias became searchable")
	}

	wards := kl.GetWards()
	wards[0].Name = "Changed"
	if kl.GetWards()[0].Name == "Changed" {
		t.Error("mutating GetWards() result changed the dataset")
	}

	result := kl.Search("Nairobi", kl.WithTypes(kl.SearchTypeCounty))[0].Item.(kl.County)
	result.Aliases[0] = "Hacked"
	if again := kl.GetCountyByCode("047"); again.Aliases[0] != "Nairobi City" {
		t.Error("mutating a search result changed the dataset")
	}
}

func TestConcurrentUse(t *testing.T) {
	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 3; j++ {
				if kl.GetCountyByName("Nairobi City") == nil {
					t.Error("Nairobi not found")
				}
				if len(kl.GetWardsInCounty("47")) != 85 {
					t.Error("wrong ward count")
				}
				if len(kl.Search("karen")) == 0 {
					t.Error("karen not found")
				}
				_ = kl.GetAreasInLocality("Bura", "Tana River")
			}
		}()
	}
	wg.Wait()
}

func TestResultsKeepDatasetOrder(t *testing.T) {
	a := names(kl.GetCounties(), func(c kl.County) string { return c.Code })
	b := names(kl.GetCounties(), func(c kl.County) string { return c.Code })
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("order differs at %d", i)
		}
	}
}
