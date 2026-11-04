import { useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, GithubIcon, MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchTrigger } from "@/components/search-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";

const PLATFORM_LINKS = [
  { href: "#javascript", id: "javascript", label: "JavaScript" },
  { href: "#react", id: "react", label: "React" },
  { href: "#kotlin", id: "kotlin", label: "Kotlin" },
  { href: "#swift", id: "swift", label: "Swift" },
  { href: "#dart", id: "dart", label: "Dart / Flutter" },
  { href: "#php", id: "php", label: "PHP" },
  { href: "#wordpress", id: "wordpress", label: "WordPress" },
] as const;

const SECTION_IDS = [
  "counties",
  "explore",
  "install",
  "examples",
  "javascript",
  "react",
  "kotlin",
  "swift",
  "dart",
  "php",
  "wordpress",
  "contribute",
] as const;

function useActiveSection(pathname: string) {
  const [active, setActive] = useState("");

  // Re-scan on every page change: each page has different sections.
  useEffect(() => {
    setActive("");
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.2, 0.5, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return active;
}

function navClass(isActive: boolean) {
  return cn(
    "rounded-md px-2.5 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-accent font-medium text-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const active = useActiveSection(pathname);
  const onHome = pathname === "/";
  const onDocs = pathname.startsWith("/docs");
  // Home sections, and doc sections, linked from wherever you are.
  const home = (hash: string) => (onHome ? hash : `/${hash}`);
  const docs = (hash: string) => (onDocs ? hash : `/docs${hash}`);
  const docsActive = onDocs && active !== "contribute";
  const isHomeSection = (id: string) => onHome && active === id;

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <a
          className="font-heading shrink-0 font-semibold tracking-tight"
          href={onHome ? "#top" : "/"}
        >
          kenya-locations
        </a>

        <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          <a className={navClass(isHomeSection("counties"))} href={home("#counties")}>
            Counties
          </a>
          <a className={navClass(isHomeSection("explore"))} href={home("#explore")}>
            Explore
          </a>
          <Menu>
            <MenuTrigger
              className={cn("inline-flex items-center gap-1", navClass(docsActive))}
              render={<button type="button" />}
            >
              Docs
              <ChevronDownIcon className="size-3.5 opacity-70" />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuLinkItem href="/docs">Overview &amp; install</MenuLinkItem>
              <MenuSeparator />
              {PLATFORM_LINKS.map((link) => (
                <MenuLinkItem href={docs(link.href)} key={link.href}>
                  {link.label}
                </MenuLinkItem>
              ))}
            </MenuPopup>
          </Menu>
          <a className={navClass(pathname.startsWith("/data"))} href="/data">
            Data
          </a>
          <a className={navClass(onDocs && active === "contribute")} href={docs("#contribute")}>
            Contribute
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchTrigger />
          <div className="lg:hidden">
            <Menu>
              <MenuTrigger
                aria-label="Open menu"
                render={<Button size="icon" variant="ghost" />}
              >
                <MenuIcon />
              </MenuTrigger>
              <MenuPopup align="end">
                <MenuLinkItem href={home("#counties")}>Counties</MenuLinkItem>
                <MenuLinkItem href={home("#explore")}>Explore</MenuLinkItem>
                <MenuLinkItem href="/data">Data</MenuLinkItem>
                <MenuSeparator />
                <MenuLinkItem href="/docs">Docs</MenuLinkItem>
                {PLATFORM_LINKS.map((link) => (
                  <MenuLinkItem href={docs(link.href)} key={link.href}>
                    {link.label}
                  </MenuLinkItem>
                ))}
                <MenuSeparator />
                <MenuLinkItem href={docs("#contribute")}>Contribute</MenuLinkItem>
              </MenuPopup>
            </Menu>
          </div>
          <Button
            render={
              <a
                href="https://github.com/DavidAmunga/kenya-locations"
                rel="noreferrer"
                target="_blank"
              />
            }
            size="sm"
            variant="ghost"
          >
            <GithubIcon />
            <span className="hidden xl:inline">GitHub</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
