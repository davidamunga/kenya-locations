import { getCounties } from "kenya-locations";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildAreaIssueUrl } from "@/lib/github-issue";
import {
  getSubmissionsUrl,
  MAX_DISPLAY_NAME_LENGTH,
  sendAreaSubmission,
  submissionProblem,
} from "@/lib/submissions";

type AreaSubmissionFormProps = {
  onSubmit?: (data: { county: string; locality: string; area: string }) => void;
};

const EMPTY = {
  county: "",
  locality: "",
  area: "",
  displayName: "",
  consent: false,
  website: "", // honeypot: hidden from people, filled in by bots
};

export function AreaSubmissionForm({ onSubmit }: AreaSubmissionFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const counties = getCounties();
  // Without an endpoint in this build, the form opens a prefilled GitHub issue instead.
  const endpoint = getSubmissionsUrl();

  function openIssue() {
    const url = buildAreaIssueUrl(formData);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Finish the issue on GitHub.");
    finish();
  }

  function finish() {
    const { county, locality, area } = formData;
    setFormData(EMPTY);
    setFailed(false);
    setOpen(false);
    onSubmit?.({ county, locality, area });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formData.county || !formData.locality.trim() || !formData.area.trim()) {
      toast.error("Fill in county, locality, and area.");
      return;
    }

    if (!endpoint) {
      openIssue();
      return;
    }

    const county = counties.find((c) => c.name === formData.county);
    const submission = {
      countyCode: county?.code ?? "",
      locality: formData.locality,
      area: formData.area,
      displayName: formData.displayName,
      consent: formData.consent,
      website: formData.website,
    };
    const problem = submissionProblem(submission);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (!formData.consent) {
      toast.error("Tick the box to agree to the data license.");
      return;
    }

    setSending(true);
    const result = await sendAreaSubmission(submission);
    setSending(false);
    if (result.ok) {
      toast.success("Thanks! We'll review your suggestion before it goes in.");
      finish();
      return;
    }
    setFailed(true);
    toast.error(
      result.reason === "rejected"
        ? "That didn't look right. Check the names and try again, or use GitHub."
        : "Couldn't send it. Try again, or use GitHub.",
    );
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PlusIcon />
        Submit an area
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Submit an area</DialogTitle>
          <DialogDescription>
            {endpoint
              ? "Missing estate or neighbourhood? Tell us and we'll review it before it goes into the data. No GitHub account needed."
              : "Missing estate or neighbourhood? We will open a GitHub issue with these details. You need to be signed in to submit."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 px-6 pb-2" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel>County</FieldLabel>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  county: String(value ?? ""),
                }))
              }
              value={formData.county || null}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a county" />
              </SelectTrigger>
              <SelectPopup>
                {counties.map((county) => (
                  <SelectItem key={county.code} value={county.name}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="locality">Locality</FieldLabel>
            <Input
              id="locality"
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  locality: event.target.value,
                }))
              }
              placeholder="Westlands"
              required
              value={formData.locality}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="area">Area</FieldLabel>
            <Input
              id="area"
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, area: event.target.value }))
              }
              placeholder="Gigiri"
              required
              value={formData.area}
            />
          </Field>
          {endpoint && (
            <>
              <Field>
                <FieldLabel htmlFor="display-name">Your name (optional)</FieldLabel>
                <Input
                  autoComplete="off"
                  id="display-name"
                  maxLength={MAX_DISPLAY_NAME_LENGTH}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayName: event.target.value,
                    }))
                  }
                  placeholder="Jane Doe"
                  value={formData.displayName}
                />
                <p className="text-muted-foreground text-xs">
                  Credited in the changelog. Suggestions are collected in a
                  public sheet, so anything you type here is public.
                </p>
              </Field>
              {/* Honeypot: off-screen and skipped by keyboards and screen readers. */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="website">Website</label>
                <input
                  autoComplete="off"
                  id="website"
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: event.target.value,
                    }))
                  }
                  tabIndex={-1}
                  type="text"
                  value={formData.website}
                />
              </div>
              <label className="flex items-start gap-2 text-sm" htmlFor="consent">
                <Checkbox
                  checked={formData.consent}
                  id="consent"
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, consent: checked === true }))
                  }
                />
                <span>
                  I agree this can be published under the data's license,{" "}
                  <a
                    className="underline underline-offset-4"
                    href="https://creativecommons.org/licenses/by/4.0/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    CC BY 4.0
                  </a>
                  .
                </span>
              </label>
            </>
          )}
          <DialogFooter className="-mx-6 mt-2" variant="bare">
            <Button
              onClick={() => {
                setFormData(EMPTY);
                setFailed(false);
              }}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            {endpoint && failed && (
              <Button onClick={openIssue} type="button" variant="outline">
                Use GitHub instead
              </Button>
            )}
            <Button disabled={sending} type="submit">
              {endpoint ? (sending ? "Sending…" : "Submit") : "Open GitHub issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
