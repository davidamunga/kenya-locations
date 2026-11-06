package kenyalocations

import (
	"embed"
	"encoding/json"
	"fmt"
	"sync"
)

var dataFS embed.FS

const (
	countyCodeWidth       = 3
	constituencyCodeWidth = 3
	subCountyCodeWidth    = 5
	wardCodeWidth         = 4
)

type dataset struct {
	counties       []County
	subCounties    []SubCounty
	constituencies []Constituency
	wards          []Ward
	localities     []Locality
	areas          []Area

	countyByCode       map[string]int
	subCountyByCode    map[string]int
	constituencyByCode map[string]int
	wardByCode         map[string]int

	countyNames       *nameIndex[County]
	subCountyNames    *nameIndex[SubCounty]
	constituencyNames *nameIndex[Constituency]
	wardNames         *nameIndex[Ward]
	localityNames     *nameIndex[Locality]
	areaNames         *nameIndex[Area]
}

var (
	loadOnce sync.Once
	loaded   *dataset
)

func load() *dataset {
	loadOnce.Do(func() {
		d := &dataset{}
		readJSON("counties.json", &d.counties)
		readJSON("sub-counties.json", &d.subCounties)
		readJSON("constituencies.json", &d.constituencies)
		readJSON("wards.json", &d.wards)
		readJSON("locality.json", &d.localities)
		readJSON("area.json", &d.areas)

		d.countyByCode = codeIndex(d.counties, func(c County) string { return c.Code })
		d.subCountyByCode = codeIndex(d.subCounties, func(s SubCounty) string { return s.Code })
		d.constituencyByCode = codeIndex(d.constituencies, func(c Constituency) string { return c.Code })
		d.wardByCode = codeIndex(d.wards, func(w Ward) string { return w.Code })

		d.countyNames = newNameIndex(d.counties, func(c County) []string {
			return append([]string{c.Name}, c.Aliases...)
		})
		d.subCountyNames = newNameIndex(d.subCounties, func(s SubCounty) []string { return []string{s.Name} })
		d.constituencyNames = newNameIndex(d.constituencies, func(c Constituency) []string { return []string{c.Name} })
		d.wardNames = newNameIndex(d.wards, func(w Ward) []string { return []string{w.Name} })
		d.localityNames = newNameIndex(d.localities, func(l Locality) []string { return []string{l.Name} })
		d.areaNames = newNameIndex(d.areas, func(a Area) []string { return []string{a.Name} })

		loaded = d
	})
	return loaded
}

func readJSON(filename string, into any) {
	raw, err := dataFS.ReadFile("data/" + filename)
	if err != nil {
		panic(fmt.Sprintf("kenya-locations: unable to read %s: %v", filename, err))
	}
	if err := json.Unmarshal(raw, into); err != nil {
		panic(fmt.Sprintf("kenya-locations: invalid JSON in %s: %v", filename, err))
	}
}

func codeIndex[T any](items []T, code func(T) string) map[string]int {
	m := make(map[string]int, len(items))
	for i, item := range items {
		if _, ok := m[code(item)]; !ok {
			m[code(item)] = i
		}
	}
	return m
}
