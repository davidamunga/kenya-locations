package kenyalocations_test

import (
	"fmt"

	kl "github.com/davidamunga/kenya-locations/packages/go"
)

func ExampleGetCountyByName() {
	nairobi := kl.GetCountyByName("nairobi city")
	fmt.Println(nairobi.Name, nairobi.Capital, nairobi.Population2019)

	// Output:
	// Nairobi Nairobi 4397073
}

func ExampleGetCountyByCode() {
	fmt.Println(kl.GetCountyByCode("47").Name)
	fmt.Println(kl.GetCountyByCode("999") == nil)

	// Output:
	// Nairobi
	// true
}

func ExampleGetWardsInConstituency() {
	fmt.Println(len(kl.GetWardsInConstituency("Westlands")))

	// Output:
	// 5
}

func ExampleGetConstituencyOfWard() {
	fmt.Println(kl.GetConstituencyOfWard("Mountain View").Name)

	// Output:
	// Westlands
}

func ExampleGetWardByName_ambiguous() {
	fmt.Println(kl.GetWardByName("Township") == nil)
	fmt.Println(len(kl.GetWardsByName("Township")) > 1)

	// Output:
	// true
	// true
}

func ExampleGetAreasInLocality() {
	areas := kl.GetAreasInLocality("Bura", "Tana River")
	fmt.Println(len(areas) > 0, areas[0].County)

	// Output:
	// true Tana River
}

func ExampleSearch() {
	results := kl.Search("Nairbi", kl.WithLimit(5), kl.WithTypes(kl.SearchTypeCounty))
	fmt.Println(results[0].Name())

	// Output:
	// Nairobi
}

func ExampleSearchResult() {
	for _, result := range kl.Search("Nairobi", kl.WithLimit(1)) {
		switch item := result.Item.(type) {
		case kl.County:
			fmt.Println("county", item.Capital)
		case kl.Ward:
			fmt.Println("ward", item.Constituency)
		}
	}

	// Output:
	// county Nairobi
}
