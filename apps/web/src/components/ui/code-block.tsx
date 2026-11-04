import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
};

export function CodeBlock({
  children,
  language = "ts",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const lines = children.replace(/\n$/, "").split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  const label =
    status === "copied"
      ? "Copied"
      : status === "failed"
        ? "Could not copy"
        : "Copy code";

  return (
    <div className="relative overflow-hidden rounded-xl border bg-background text-foreground shadow-xs/5">
      {(filename || language) && (
        <div className="flex items-center justify-between gap-3 border-b px-3 py-1.5">
          <span className="truncate font-mono text-muted-foreground text-xs">
            {filename ?? language}
          </span>
          <Button
            aria-label={label}
            className="text-muted-foreground"
            onClick={copy}
            size="icon-xs"
            variant="ghost"
          >
            {status === "copied" ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
      )}
      {!filename && (
        <Button
          aria-label={label}
          className="absolute top-2 right-2 z-10 text-muted-foreground"
          onClick={copy}
          size="icon-xs"
          variant="ghost"
        >
          {status === "copied" ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
      <p aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </p>
      <pre
        className={cn(
          "overflow-x-auto p-4 font-mono text-sm leading-6",
          !filename && "pt-10",
        )}
      >
        <code>
          {showLineNumbers ? (
            <table className="border-separate border-spacing-0">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="select-none pr-4 text-right text-muted-foreground/70">
                      {index + 1}
                    </td>
                    <td className="whitespace-pre">{line || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            children
          )}
        </code>
      </pre>
    </div>
  );
}
