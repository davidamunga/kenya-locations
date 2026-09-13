import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
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
          "Kenyan administrative divisions as a typed library for JavaScript, React, Kotlin, Swift, PHP, and WordPress.",
        image: "https://kenya-locations.web.app/ogimage.jpg",
        keywords:
          "kenya, locations, counties, constituencies, wards, localities, kotlin, swift, react, php, wordpress, woocommerce, composer",
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
        defaultTheme="light"
        enableSystem={false}
        storageKey="kenya-locations-theme"
      >
      <HeadContent />
      <SiteHeader />
      <Outlet />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  ),
});
