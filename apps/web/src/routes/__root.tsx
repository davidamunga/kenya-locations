import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SearchCommand } from "@/components/search-command";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { seo } from "@/lib/seo";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "kenya-locations",
        description:
          "Kenya's counties, constituencies, wards and sub-counties, plus the estates and neighbourhoods people use in addresses. Look up any place, see its codes, and use the same data in JavaScript, React, Kotlin, Swift, Dart, PHP and WordPress.",
        image: "https://kenya-locations.web.app/ogimage.jpg",
        keywords:
          "kenya, locations, counties, constituencies, wards, sub-counties, localities, areas, estates, neighbourhoods, addresses, iebc, knbs, kotlin, swift, dart, flutter, react, php, wordpress, woocommerce, composer",
      }),
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  component: () => (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="kenya-locations-theme"
      >
      <HeadContent />
      <a
        className="sr-only z-50 rounded-md bg-background px-3 py-2 shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#main"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1" id="main">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <SearchCommand />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  ),
});
