import { createFileRoute } from "@tanstack/react-router";
import { Docs } from "@/components/docs";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: seo({
      title: "Docs · kenya-locations",
      description:
        "Install and use kenya-locations in JavaScript, React, Kotlin, Swift, Dart, PHP and WordPress.",
    }),
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <header className="max-w-2xl">
        <h1 className="font-heading font-semibold text-3xl tracking-tight sm:text-4xl">Docs</h1>
        <p className="mt-3 text-muted-foreground">
          The same data and the same lookups in every library: pick a county, drill down to its
          constituencies and wards, or search with typos.
        </p>
      </header>
      <Docs />
    </div>
  );
}
