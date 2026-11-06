package kenyalocations

type County struct {
	Code           string   `json:"code"`
	ISOCode        string   `json:"iso_code"`
	Name           string   `json:"name"`
	Capital        string   `json:"capital"`
	AreaKm2        float64  `json:"area_km2"`
	Population2019 int64    `json:"population_2019"`
	Region         string   `json:"region"`
	PostalCode     string   `json:"postal_code"`
	Aliases        []string `json:"aliases"`
}

type SubCounty struct {
	Code       string `json:"code"`
	Name       string `json:"name"`
	County     string `json:"county"`
	CountyCode string `json:"county_code"`
}

type Constituency struct {
	Code       string `json:"code"`
	Name       string `json:"name"`
	County     string `json:"county"`
	CountyCode string `json:"county_code"`
}

type Ward struct {
	Code             string `json:"code"`
	Name             string `json:"name"`
	Constituency     string `json:"constituency"`
	ConstituencyCode string `json:"constituency_code"`
	CountyCode       string `json:"county_code"`
	SubCountyCode    string `json:"sub_county_code"`
}

type Locality struct {
	Name       string `json:"name"`
	County     string `json:"county"`
	CountyCode string `json:"county_code"`
}

type Area struct {
	Name       string `json:"name"`
	Locality   string `json:"locality"`
	County     string `json:"county"`
	CountyCode string `json:"county_code"`
}

func (c County) clone() County {
	c.Aliases = append([]string{}, c.Aliases...)
	return c
}

func ptr[T any](v T) *T { return &v }
