package kenyalocations_test

import (
	"fmt"

	kl "github.com/davidamunga/kenya-locations/packages/go"
)

func ExampleGetCountyByName() {
	nairobi := kl.GetCountyByName("nairobi city")
	fmt.Println(nairobi.Name, nairobi.Capital, nairobi.Population2019)

}

func ExampleGetCountyByCode() {
	fmt.Println(kl.GetCountyByCode("47").Name)
	fmt.Println(kl.GetCountyByCode("999") == nil)

}

func ExampleGetWardsInConstituency() {
	fmt.Println(len(kl.GetWardsInConstituency("Westlands")))

}

func ExampleGetConstituencyOfWard() {
	fmt.Println(kl.GetConstituencyOfWard("Mountain View").Name)

}

func ExampleGetWardByName_ambiguous() {
	fmt.Println(kl.GetWardByName("Township") == nil)
	fmt.Println(len(kl.GetWardsByName("Township")) > 1)

}

func ExampleGetAreasInLocality() {
	areas := kl.GetAreasInLocality("Bura", "Tana River")
	fmt.Println(len(areas) > 0, areas[0].County)
}

func ExampleSearch() {
	results := kl.Search("Nairbi", kl.WithLimit(5), kl.WithTypes(kl.SearchTypeCounty))
	fmt.Println(results[0].Name())
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
}
