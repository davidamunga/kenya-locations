package kenyalocations

func GetCounties() []County {
	d := load()
	out := make([]County, len(d.counties))
	for i, c := range d.counties {
		out[i] = c.clone()
	}
	return out
}

func GetCountyByCode(code string) *County {
	if c, ok := countyByCode(code); ok {
		return ptr(c.clone())
	}
	return nil
}

func GetCountyByName(name string) *County {
	if c, ok := load().countyNames.unique(name); ok {
		return ptr(c.clone())
	}
	return nil
}

func GetSubCounties() []SubCounty {
	return append([]SubCounty{}, load().subCounties...)
}

func GetSubCountyByCode(code string) *SubCounty {
	if s, ok := subCountyByCode(code); ok {
		return ptr(s)
	}
	return nil
}

func GetSubCountyByName(name string) *SubCounty {
	if s, ok := load().subCountyNames.unique(name); ok {
		return ptr(s)
	}
	return nil
}

func GetSubCountiesInCounty(county string) []SubCounty {
	c, ok := resolveCounty(county)
	if !ok {
		return []SubCounty{}
	}
	return filter(load().subCounties, func(s SubCounty) bool { return s.CountyCode == c.Code })
}

func GetCountyOfSubCounty(subCounty string) *County {
	if s, ok := resolveSubCounty(subCounty); ok {
		return GetCountyByCode(s.CountyCode)
	}
	return nil
}

func GetConstituencies() []Constituency {
	return append([]Constituency{}, load().constituencies...)
}

func GetConstituencyByCode(code string) *Constituency {
	if c, ok := constituencyByCode(code); ok {
		return ptr(c)
	}
	return nil
}

func GetConstituencyByName(name string) *Constituency {
	if c, ok := load().constituencyNames.unique(name); ok {
		return ptr(c)
	}
	return nil
}

func GetConstituenciesInCounty(county string) []Constituency {
	c, ok := resolveCounty(county)
	if !ok {
		return []Constituency{}
	}
	return filter(load().constituencies, func(x Constituency) bool { return x.CountyCode == c.Code })
}

func GetCountyOfConstituency(constituency string) *County {
	if c, ok := resolveConstituency(constituency); ok {
		return GetCountyByCode(c.CountyCode)
	}
	return nil
}

func GetWards() []Ward {
	return append([]Ward{}, load().wards...)
}

func GetWardByCode(code string) *Ward {
	if w, ok := wardByCode(code); ok {
		return ptr(w)
	}
	return nil
}

func GetWardByName(name string) *Ward {
	if w, ok := load().wardNames.unique(name); ok {
		return ptr(w)
	}
	return nil
}

func GetWardsByName(name string) []Ward {
	return load().wardNames.all(name)
}

func GetWardsInConstituency(constituency string) []Ward {
	c, ok := resolveConstituency(constituency)
	if !ok {
		return []Ward{}
	}
	return filter(load().wards, func(w Ward) bool { return w.ConstituencyCode == c.Code })
}

func GetWardsInCounty(county string) []Ward {
	c, ok := resolveCounty(county)
	if !ok {
		return []Ward{}
	}
	return filter(load().wards, func(w Ward) bool { return w.CountyCode == c.Code })
}

func GetWardsInSubCounty(subCounty string) []Ward {
	s, ok := resolveSubCounty(subCounty)
	if !ok {
		return []Ward{}
	}
	return filter(load().wards, func(w Ward) bool { return w.SubCountyCode == s.Code })
}

func GetCountyOfWard(ward string) *County {
	if w, ok := resolveWard(ward); ok {
		return GetCountyByCode(w.CountyCode)
	}
	return nil
}

func GetSubCountyOfWard(ward string) *SubCounty {
	if w, ok := resolveWard(ward); ok {
		return GetSubCountyByCode(w.SubCountyCode)
	}
	return nil
}

func GetConstituencyOfWard(ward string) *Constituency {
	if w, ok := resolveWard(ward); ok {
		return GetConstituencyByCode(w.ConstituencyCode)
	}
	return nil
}

func GetLocalities() []Locality {
	return append([]Locality{}, load().localities...)
}

func GetLocalityByName(name string) *Locality {
	return GetLocality(name)
}

func GetLocality(name string, county ...string) *Locality {
	d := load()
	if len(county) == 0 {
		if l, ok := d.localityNames.unique(name); ok {
			return ptr(l)
		}
		return nil
	}
	c, ok := resolveCounty(county[0])
	if !ok {
		return nil
	}
	matches := filter(d.localityNames.all(name), func(l Locality) bool { return l.CountyCode == c.Code })
	if len(matches) == 1 {
		return ptr(matches[0])
	}
	return nil
}

func GetLocalitiesByName(name string) []Locality {
	return load().localityNames.all(name)
}

func GetLocalitiesInCounty(county string) []Locality {
	c, ok := resolveCounty(county)
	if !ok {
		return []Locality{}
	}
	return filter(load().localities, func(l Locality) bool { return l.CountyCode == c.Code })
}

func GetCountyOfLocality(locality string) *County {
	if l := GetLocality(locality); l != nil {
		return GetCountyByCode(l.CountyCode)
	}
	return nil
}

func GetAreas() []Area {
	return append([]Area{}, load().areas...)
}

func GetAreaByName(name string) *Area {
	if a, ok := load().areaNames.unique(name); ok {
		return ptr(a)
	}
	return nil
}

func GetAreasByName(name string) []Area {
	return load().areaNames.all(name)
}

func GetAreasInLocality(locality string, county ...string) []Area {
	l := GetLocality(locality, county...)
	if l == nil {
		return []Area{}
	}
	name := lower(l.Name)
	return filter(load().areas, func(a Area) bool {
		return a.CountyCode == l.CountyCode && lower(a.Locality) == name
	})
}

func GetAreasInCounty(county string) []Area {
	c, ok := resolveCounty(county)
	if !ok {
		return []Area{}
	}
	return filter(load().areas, func(a Area) bool { return a.CountyCode == c.Code })
}

func GetCountyOfArea(area string) *County {
	if a := GetAreaByName(area); a != nil {
		return GetCountyByCode(a.CountyCode)
	}
	return nil
}
func GetLocalityOfArea(area string) *Locality {
	if a := GetAreaByName(area); a != nil {
		return GetLocality(a.Locality, a.CountyCode)
	}
	return nil
}

func countyByCode(code string) (County, bool) {
	d := load()
	i, ok := d.countyByCode[normaliseCode(code, countyCodeWidth)]
	if !ok {
		return County{}, false
	}
	return d.counties[i], true
}

func subCountyByCode(code string) (SubCounty, bool) {
	d := load()
	i, ok := d.subCountyByCode[normaliseCode(code, subCountyCodeWidth)]
	if !ok {
		return SubCounty{}, false
	}
	return d.subCounties[i], true
}

func constituencyByCode(code string) (Constituency, bool) {
	d := load()
	i, ok := d.constituencyByCode[normaliseCode(code, constituencyCodeWidth)]
	if !ok {
		return Constituency{}, false
	}
	return d.constituencies[i], true
}

func wardByCode(code string) (Ward, bool) {
	d := load()
	i, ok := d.wardByCode[normaliseCode(code, wardCodeWidth)]
	if !ok {
		return Ward{}, false
	}
	return d.wards[i], true
}

func resolveCounty(nameOrCode string) (County, bool) {
	if c, ok := countyByCode(nameOrCode); ok {
		return c, true
	}
	return load().countyNames.unique(nameOrCode)
}

func resolveConstituency(nameOrCode string) (Constituency, bool) {
	if c, ok := constituencyByCode(nameOrCode); ok {
		return c, true
	}
	return load().constituencyNames.unique(nameOrCode)
}

func resolveSubCounty(nameOrCode string) (SubCounty, bool) {
	if s, ok := subCountyByCode(nameOrCode); ok {
		return s, true
	}
	return load().subCountyNames.unique(nameOrCode)
}

func resolveWard(nameOrCode string) (Ward, bool) {
	if w, ok := wardByCode(nameOrCode); ok {
		return w, true
	}
	return load().wardNames.unique(nameOrCode)
}

func filter[T any](items []T, keep func(T) bool) []T {
	out := make([]T, 0)
	for _, item := range items {
		if keep(item) {
			out = append(out, item)
		}
	}
	return out
}
