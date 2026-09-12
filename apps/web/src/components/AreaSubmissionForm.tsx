import { getCounties } from "kenya-locations";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

type AreaSubmissionFormProps = {
  onSubmit?: (data: { county: string; locality: string; area: string }) => void;
};

export function AreaSubmissionForm({ onSubmit }: AreaSubmissionFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    county: "",
    locality: "",
    area: "",
  });

  const counties = getCounties();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formData.county || !formData.locality.trim() || !formData.area.trim()) {
      toast.error("Fill in county, locality, and area.");
      return;
    }

    const url = buildAreaIssueUrl(formData);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Finish the issue on GitHub.");
    setFormData({ county: "", locality: "", area: "" });
    setOpen(false);
    onSubmit?.(formData);
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
            Missing estate or neighbourhood? We will open a GitHub issue with
            these details. You need to be signed in to submit.
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
          <DialogFooter className="-mx-6 mt-2" variant="bare">
            <Button
              onClick={() => setFormData({ county: "", locality: "", area: "" })}
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
            <Button type="submit">Open GitHub issue</Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
