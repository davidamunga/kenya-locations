import { useRouter } from "@tanstack/react-router";
import type * as React from "react";

/**
 * An <a> for in-app paths built at runtime ("/ward/0737"). Plain clicks
 * navigate through the router; modified clicks (new tab, etc.) and
 * non-JS fall back to the normal link.
 */
export function AppLink({
  href,
  onClick,
  ...props
}: React.ComponentProps<"a"> & { href: string }) {
  const router = useRouter();
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        void router.navigate({ href });
      }}
      {...props}
    />
  );
}
