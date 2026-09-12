import { ChevronDownIcon, GithubIcon, MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
  { href: "#php", id: "php", label: "PHP" },
] as const;

const SECTION_IDS = [
  "explore",
  "install",
  "examples",
  "javascript",
  "react",
  "kotlin",
  "swift",
  "php",
  "contribute",
] as const;

function useActiveSection() {
  const [active, setActive] = useState("explore");

  useEffect(() => {
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
  }, []);

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
  const active = useActiveSection();
  const docsActive = PLATFORM_LINKS.some((link) => link.id === active);

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <a
          className="font-heading shrink-0 font-semibold tracking-tight"
          href="#top"
        >
          kenya-locations
        </a>

        <nav aria-label="Documentation" className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          <a className={navClass(active === "explore")} href="#explore">
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
              {PLATFORM_LINKS.map((link) => (
                <MenuLinkItem href={link.href} key={link.href}>
                  {link.label}
                </MenuLinkItem>
              ))}
            </MenuPopup>
          </Menu>
          <a className={navClass(active === "contribute")} href="#contribute">
            Contribute
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="md:hidden">
            <Menu>
              <MenuTrigger
                aria-label="Open menu"
                render={<Button size="icon" variant="ghost" />}
              >
                <MenuIcon />
              </MenuTrigger>
              <MenuPopup align="end">
                <MenuLinkItem href="#explore">Explore</MenuLinkItem>
                <MenuSeparator />
                {PLATFORM_LINKS.map((link) => (
                  <MenuLinkItem href={link.href} key={link.href}>
                    {link.label}
                  </MenuLinkItem>
                ))}
                <MenuSeparator />
                <MenuLinkItem href="#contribute">Contribute</MenuLinkItem>
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
            <span className="hidden sm:inline">GitHub</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
