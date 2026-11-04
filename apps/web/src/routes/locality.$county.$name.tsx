import { createFileRoute } from "@tanstack/react-router";
import { PlaceNotFound, PlacePage } from "@/components/place-page";
import { localityPlace } from "@/lib/places";
import { placeSeo } from "@/lib/seo";

// Localities have no codes yet, so the URL is county code + name. This moves
// to a stable locality ID in data Phase 2.
export const Route = createFileRoute("/locality/$county/$name")({
  loader: ({ params }) => localityPlace(params.county, params.name),
  head: ({ loaderData }) => ({ meta: placeSeo(loaderData, "Locality") }),
  component: LocalityRoute,
});

function LocalityRoute() {
  const place = Route.useLoaderData();
  const params = Route.useParams();
  return place ? (
    <PlacePage place={place} />
  ) : (
    <PlaceNotFound id={`${params.name} (${params.county})`} kind="Locality" />
  );
}
