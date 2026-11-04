import { createFileRoute } from "@tanstack/react-router";
import { PlaceNotFound, PlacePage } from "@/components/place-page";
import { wardPlace } from "@/lib/places";
import { placeSeo } from "@/lib/seo";

export const Route = createFileRoute("/ward/$code")({
  loader: ({ params }) => wardPlace(params.code),
  head: ({ loaderData }) => ({ meta: placeSeo(loaderData, "Ward") }),
  component: WardRoute,
});

function WardRoute() {
  const place = Route.useLoaderData();
  const params = Route.useParams();
  return place ? <PlacePage place={place} /> : <PlaceNotFound id={params.code} kind="Ward" />;
}
