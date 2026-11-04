import { createFileRoute } from "@tanstack/react-router";
import { PlaceNotFound, PlacePage } from "@/components/place-page";
import { countyPlace } from "@/lib/places";
import { placeSeo } from "@/lib/seo";

export const Route = createFileRoute("/county/$code")({
  loader: ({ params }) => countyPlace(params.code),
  head: ({ loaderData }) => ({ meta: placeSeo(loaderData, "County") }),
  component: CountyRoute,
});

function CountyRoute() {
  const place = Route.useLoaderData();
  const params = Route.useParams();
  return place ? <PlacePage place={place} /> : <PlaceNotFound id={params.code} kind="County" />;
}
