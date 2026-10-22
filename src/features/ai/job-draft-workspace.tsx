"use client";

import { useActionState, useState } from "react";
import { approveJobDraft, generateJobDraft, type JobDraftState } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { Textarea } from "@/components/ui/textarea";

const initialState: JobDraftState = { ok: false, message: "" };

type ApprovedDraftState = Required<
  Pick<JobDraftState, "generationId" | "jobId" | "title" | "summary" | "description">
> &
  JobDraftState;

function isApprovedDraft(state: JobDraftState): state is ApprovedDraftState {
  return Boolean(
    state.ok &&
    state.generationId &&
    state.jobId &&
    state.title &&
    state.summary &&
    state.description,
  );
}

export function JobDraftWorkspace({
  jobs,
  allowAi,
  initialJobId,
}: {
  jobs: { id: string; title: string }[];
  allowAi: boolean;
  initialJobId?: string;
}) {
  const [state, action, pending] = useActionState(generateJobDraft, initialState);
  return (
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      {!allowAi ? (
        <div className="empty-state lg:col-span-2">
          <h2>Wariant ręczny</h2>
          <p>
            W tej kohorcie tekst oferty powstaje bez asysty AI. Źródłowy brief i publikacja
            pozostają rozdzielone.
          </p>
        </div>
      ) : (
        <>
          <form
            action={action}
            className="form-stack h-fit rounded-xl bg-card p-6 shadow-[var(--gui-shadow-m)]"
          >
            <h2>Szkic z briefu</h2>
            <p>
              Model widzi prywatny brief i kryteria decyzji. Wygenerowany tekst nie publikuje się
              automatycznie.
            </p>
            <div className="field">
              <Label htmlFor="jobId">Oferta</Label>
              <FormSelect
                id="jobId"
                name="jobId"
                ariaLabel="Oferta do wygenerowania"
                required
                defaultValue={initialJobId ?? jobs[0]?.id}
                options={jobs.map((job) => ({ value: job.id, label: job.title }))}
              />
            </div>
            <Button type="submit" disabled={pending || !jobs.length}>
              {pending ? "Generuję…" : "Wygeneruj szkic"}
            </Button>
            {state.message && (
              <p
                role={state.ok ? "status" : "alert"}
                className={state.ok ? "success-panel" : "error-message"}
              >
                {state.message}
              </p>
            )}
          </form>
          {isApprovedDraft(state) ? (
            <ApprovalForm key={state.generationId} state={state} />
          ) : (
            <div className="empty-state">
              <h2>Szkic pojawi się tutaj</h2>
              <p>
                Przed zatwierdzeniem porównaj go z briefem i przywróć kryteria, których model nie
                zachował.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApprovalForm({ state }: { state: ApprovedDraftState }) {
  const [approval, action, pending] = useActionState(approveJobDraft, initialState);
  const [title, setTitle] = useState(state.title);
  const [summary, setSummary] = useState(state.summary);
  const [description, setDescription] = useState(state.description);
  return (
    <form action={action} className="form-stack rounded-xl bg-secondary p-6">
      <input type="hidden" name="jobId" value={state.jobId} />
      <input type="hidden" name="generationId" value={state.generationId} />
      <h2>Sprawdź i zatwierdź</h2>
      <div className="field">
        <Label htmlFor="draft-title">Tytuł</Label>
        <Input
          id="draft-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          readOnly={approval.ok}
          required
        />
      </div>
      <div className="field">
        <Label htmlFor="draft-summary">Podsumowanie</Label>
        <Textarea
          id="draft-summary"
          name="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          readOnly={approval.ok}
          rows={3}
          required
        />
      </div>
      <div className="field">
        <Label htmlFor="draft-description">Opis</Label>
        <Textarea
          id="draft-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          readOnly={approval.ok}
          rows={12}
          required
        />
      </div>
      <p className="text-sm">
        Zatwierdzenie zapisze nową, prywatną wersję. Nie zmieni opublikowanej oferty — publikacja
        pozostaje osobną decyzją operatora.
      </p>
      <Button type="submit" disabled={pending || approval.ok}>
        {pending ? "Zatwierdzam…" : approval.ok ? "Wersja zapisana" : "Zatwierdź wersję"}
      </Button>
      {approval.message && (
        <p
          role={approval.ok ? "status" : "alert"}
          className={approval.ok ? "success-panel" : "error-message"}
        >
          {approval.message}
        </p>
      )}
    </form>
  );
}
