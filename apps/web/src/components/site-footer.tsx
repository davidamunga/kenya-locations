import { DATA_VERSION } from "kenya-locations";
import { AppLink } from "@/components/app-link";

const linkClass = "underline-offset-4 hover:text-foreground hover:underline";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-muted-foreground text-sm sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">kenya-locations</p>
          <p>
            Code{" "}
            <a
              className={linkClass}
              href="https://github.com/DavidAmunga/kenya-locations/blob/main/LICENSE"
              rel="noreferrer"
              target="_blank"
            >
              MIT
            </a>{" "}
            · Data{" "}
            <AppLink className={linkClass} href="/data#license">
              CC BY 4.0
            </AppLink>{" "}
            from IEBC and KNBS · v{DATA_VERSION}
          </p>
          <p>
            By{" "}
            <a className={linkClass} href="https://davidamunga.com" rel="noreferrer" target="_blank">
              David Amunga
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <AppLink className={linkClass} href="/docs">
            Docs
          </AppLink>
          <AppLink className={linkClass} href="/data">
            Data
          </AppLink>
          <a
            className={linkClass}
            href="https://github.com/DavidAmunga/kenya-locations/issues/new/choose"
            rel="noreferrer"
            target="_blank"
          >
            Report a data problem
          </a>
          <a
            className={linkClass}
            href="https://github.com/DavidAmunga/kenya-locations"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
