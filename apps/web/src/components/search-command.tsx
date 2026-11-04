import { useRouter } from "@tanstack/react-router";
import { CornerDownLeftIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { type PlaceHit, searchPlaces, typeLabel } from "@/lib/places";

const OPEN_EVENT = "kenya-locations:open-search";

/** Open the search palette from anywhere (e.g. a button on a page). */
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const EXAMPLES = ["Westlands", "Nairobi City", "Karen", "0737", "Mombasa"];

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Site-wide search: ⌘K / Ctrl+K or "/" opens it, results jump to the
 * place's page. Exact codes ("047", "0737") match first.
 */
export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchPlaces(query, 20), [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !isTyping(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  function go(hit: PlaceHit) {
    setOpen(false);
    setQuery("");
    void router.navigate({ href: hit.href });
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogPopup aria-label="Search places">
        <Command
          itemToStringValue={(hit) => (hit as PlaceHit).label}
          items={hits}
          mode="none"
          onValueChange={setQuery}
          value={query}
        >
          <CommandInput
            aria-label="Search places"
            placeholder="Search counties, constituencies, wards, places, or a code"
          />
          <CommandPanel>
            {query.trim() === "" ? (
              <div className="flex flex-col gap-2 p-4 text-sm">
                <p className="text-muted-foreground">
                  Names are matched loosely, so typos are fine. Codes work too.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLES.map((example) => (
                    <Button
                      key={example}
                      onClick={() => setQuery(example)}
                      size="xs"
                      variant="outline"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <CommandEmpty>No places match “{query}”. Try a shorter spelling.</CommandEmpty>
                <CommandList>
                  {(hit: PlaceHit) => (
                    <CommandItem
                      className="gap-3 py-2"
                      key={hit.key}
                      onClick={() => go(hit)}
                      value={hit}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{hit.label}</span>
                        <span className="truncate text-muted-foreground text-xs">{hit.context}</span>
                      </div>
                      <span className="shrink-0 text-muted-foreground text-xs">{typeLabel(hit.type)}</span>
                    </CommandItem>
                  )}
                </CommandList>
              </>
            )}
          </CommandPanel>
          <CommandFooter>
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              to move
              <Kbd>
                <CornerDownLeftIcon className="size-3" />
              </Kbd>
              to open
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              to close
            </span>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}

/** The header button that opens search, with its shortcut. */
export function SearchTrigger() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <Button
      aria-label="Search places"
      className="w-9 justify-center gap-2 text-muted-foreground sm:w-52 sm:justify-start"
      onClick={openSearch}
      size="sm"
      variant="outline"
    >
      <SearchIcon />
      <span className="hidden flex-1 text-left sm:inline">Search places…</span>
      <Kbd className="hidden sm:inline-flex">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
    </Button>
  );
}
