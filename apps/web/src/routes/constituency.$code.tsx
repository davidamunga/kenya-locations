import { createFileRoute } from "@tanstack/react-router";
import { PlaceNotFound, PlacePage } from "@/components/place-page";
import { constituencyPlace } from "@/lib/places";
import { placeSeo } from "@/lib/seo";

export const Route = createFileRoute("/constituency/$code")({
  loader: ({ params }) => constituencyPlace(params.code),
  head: ({ loaderData }) => ({ meta: placeSeo(loaderData, "Constituency") }),
  component: ConstituencyRoute,
});

function ConstituencyRoute() {
  const place = Route.useLoaderData();
  const params = Route.useParams();
  return place ? <PlacePage place={place} /> : <PlaceNotFound id={params.code} kind="Constituency" />;
}
