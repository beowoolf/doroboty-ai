"use client";

import { useActionState, useState } from "react";
import { FilePenLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveJobBrief, type JobBriefState } from "@/features/ai/actions";

const initialState: JobBriefState = { ok: false, message: "" };

export type JobWithBrief = {
  id: string;
  title: string;
  brief?: { sourceText: string; decisionCriteria: string[] };
};

export function JobBriefForm({
  jobs,
  initialJobId,
}: {
  jobs: JobWithBrief[];
  initialJobId?: string;
}) {
  const selectedJob = jobs.find((job) => job.id === initialJobId) ?? jobs[0];
  const [state, action, pending] = useActionState(saveJobBrief, initialState);
  const [selectedId, setSelectedId] = useState(selectedJob?.id ?? "");
  const [sourceText, setSourceText] = useState(selectedJob?.brief?.sourceText ?? "");
  const [decisionCriteria, setDecisionCriteria] = useState(
    selectedJob?.brief?.decisionCriteria.join("\n") ?? "",
  );

  function selectJob(jobId: string) {
    const job = jobs.find((item) => item.id === jobId);
    setSelectedId(jobId);
    setSourceText(job?.brief?.sourceText ?? "");
    setDecisionCriteria(job?.brief?.decisionCriteria.join("\n") ?? "");
  }

  return (
    <form
      action={action}
      className="form-stack rounded-xl bg-card p-6 shadow-[var(--gui-shadow-m)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--gui-color-1-transparent)] text-[var(--gui-accent-text-accessible)]">
          <FilePenLine className="size-5" />
        </span>
        <div>
          <h2>Brief źródłowy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prywatny kontekst dla rekrutera i generatora. Nie pojawi się w publicznym ogłoszeniu.
          </p>
        </div>
      </div>
      <div className="field">
        <Label htmlFor="brief-job">Oferta</Label>
        <FormSelect
          id="brief-job"
          name="jobId"
          ariaLabel="Oferta dla briefu"
          value={selectedId}
          onValueChange={selectJob}
          options={jobs.map((job) => ({ value: job.id, label: job.title }))}
        />
      </div>
      <div className="field">
        <Label htmlFor="brief-source-text">Kontekst, potrzeba i oczekiwany rezultat</Label>
        <Textarea
          id="brief-source-text"
          name="sourceText"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          rows={7}
          minLength={40}
          maxLength={10_000}
          placeholder="Dlaczego otwieramy tę rolę, jaki problem ma rozwiązać i po czym poznamy sukces?"
          required
        />
      </div>
      <div className="field">
        <Label htmlFor="brief-criteria">Kryteria decyzji — jedno w wierszu</Label>
        <Textarea
          id="brief-criteria"
          name="decisionCriteria"
          value={decisionCriteria}
          onChange={(event) => setDecisionCriteria(event.target.value)}
          rows={5}
          placeholder={
            "Doświadczenie we wdrożeniu produkcyjnym\nUmiejętność prowadzenia discovery\nMierzalny efekt biznesowy"
          }
          required
        />
      </div>
      <Button className="w-fit" type="submit" disabled={pending || !jobs.length}>
        <Save className="size-4" /> {pending ? "Zapisuję…" : "Zapisz brief"}
      </Button>
      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "success-panel" : "error-message"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
