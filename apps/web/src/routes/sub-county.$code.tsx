import { createFileRoute } from "@tanstack/react-router";
import { PlaceNotFound, PlacePage } from "@/components/place-page";
import { subCountyPlace } from "@/lib/places";
import { placeSeo } from "@/lib/seo";

export const Route = createFileRoute("/sub-county/$code")({
  loader: ({ params }) => subCountyPlace(params.code),
  head: ({ loaderData }) => ({ meta: placeSeo(loaderData, "Sub-county") }),
  component: SubcountyRoute,
});

function SubcountyRoute() {
  const place = Route.useLoaderData();
  const params = Route.useParams();
  return place ? <PlacePage place={place} /> : <PlaceNotFound id={params.code} kind="Sub-county" />;
}
