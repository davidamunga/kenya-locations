import { createFileRoute } from "@tanstack/react-router";
import { DataPage } from "@/components/data-page";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: seo({
      title: "Download the data · kenya-locations",
      description:
        "Kenya's counties, constituencies, wards, sub-counties, localities and areas as JSON and CSV, licensed CC BY 4.0.",
    }),
  }),
  component: DataPage,
});
