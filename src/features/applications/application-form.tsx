"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, FileText, Sparkles, Trash2 } from "lucide-react";
import {
  discardApplicationDraft,
  saveApplicationDraft,
  submitApplication,
  type ApplicationActionState,
} from "@/features/applications/actions";
import { generateCandidateDraft } from "@/features/ai/actions";
import { captureBrowserAnalytics } from "@/features/analytics/client-event";
import { ExperimentExposure } from "@/features/experiments/exposure";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ApplicationActionState = { ok: false, message: "" };

type EvidenceItem = {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  url?: string | null;
  outcome?: string | null;
};

export function ApplicationForm({
  jobId,
  profileReady,
  variant,
  allowAi,
  assignmentIds,
  initialAnswer,
  profileSummary,
  experiences,
  workSamples,
  initialExperienceIds,
  initialWorkSampleIds,
  initialGenerationId,
  cvFileName,
  draftUpdatedAt,
}: {
  jobId: string;
  profileReady: boolean;
  variant: "long_form" | "one_click";
  allowAi: boolean;
  assignmentIds: string[];
  initialAnswer: string;
  profileSummary: {
    displayName: string;
    headline: string;
    bio: string;
    city: string;
    years: number;
    language: string;
  };
  experiences: EvidenceItem[];
  workSamples: EvidenceItem[];
  initialExperienceIds: string[];
  initialWorkSampleIds: string[];
  initialGenerationId?: string;
  cvFileName?: string;
  draftUpdatedAt?: string;
}) {
  const [state, action, pending] = useActionState(submitApplication, initialState);
  const [answer, setAnswer] = useState(initialAnswer);
  const [experienceIds, setExperienceIds] = useState(initialExperienceIds);
  const [workSampleIds, setWorkSampleIds] = useState(initialWorkSampleIds);
  const [generationId, setGenerationId] = useState(initialGenerationId ?? "");
  const [aiMessage, setAiMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saveState, setSaveState] = useState(draftUpdatedAt ? "Szkic przywrócony" : "");
  const started = useRef(false);
  const manualAnswer = useRef(initialGenerationId ? "" : initialAnswer);
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const discarding = useRef(false);

  const evidenceCount = experienceIds.length + workSampleIds.length;
  const currentStep = evidenceCount === 0 ? 1 : answer.trim().length < 40 ? 2 : 3;
  useEffect(() => {
    void captureBrowserAnalytics({
      event: "candidate_profile_readiness",
      properties: { ready: profileReady },
    });
  }, [profileReady]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (discarding.current) return;
      setSaveState("Zapisuję szkic…");
      const payload = {
        jobId,
        answer,
        selectedExperienceIds: experienceIds,
        selectedWorkSampleIds: workSampleIds,
        aiGenerationId: generationId,
        currentStep,
      };
      saving.current = saving.current.then(async () => {
        if (discarding.current) return;
        try {
          const result = await saveApplicationDraft(payload);
          if (!discarding.current)
            setSaveState(
              result.ok
                ? "Szkic zapisany"
                : "Nie udało się zapisać szkicu. Sprawdź połączenie i zalogowanie, a następnie spróbuj ponownie.",
            );
        } catch {
          setSaveState("Nie udało się zapisać szkicu. Zachowaj tekst i sprawdź połączenie.");
        }
      });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [answer, currentStep, experienceIds, generationId, jobId, workSampleIds]);

  function trackStart() {
    if (started.current) return;
    started.current = true;
    void captureBrowserAnalytics({ event: "application_started", properties: { jobId, variant } });
  }

  function toggle(list: string[], setList: (next: string[]) => void, id: string) {
    discarding.current = false;
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function draftWithAi() {
    setAiBusy(true);
    if (!generationId) manualAnswer.current = answer;
    const result = await generateCandidateDraft({
      jobId,
      experienceIds,
      workSampleIds,
    });
    setAiMessage(result.message);
    if (result.ok && result.text && result.generationId) {
      setAnswer(result.text);
      setGenerationId(result.generationId);
    }
    setAiBusy(false);
  }

  async function discardDraft() {
    if (!window.confirm("Usunąć zapisany szkic tej aplikacji?")) return;
    discarding.current = true;
    await saving.current;
    const data = new FormData();
    data.set("jobId", jobId);
    await discardApplicationDraft(data);
    setAnswer("");
    setExperienceIds([]);
    setWorkSampleIds([]);
    setGenerationId("");
    setSaveState("Szkic usunięty");
  }

  return (
    <form action={action} onFocusCapture={trackStart} className="grid gap-[var(--gui-space-m)]">
      {assignmentIds.map((assignmentId) => (
        <ExperimentExposure key={assignmentId} assignmentId={assignmentId} />
      ))}
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="variant" value={variant} />
      <input type="hidden" name="aiGenerationId" value={generationId} />
      {experienceIds.map((id) => (
        <input key={id} type="hidden" name="selectedExperienceIds" value={id} />
      ))}
      {workSampleIds.map((id) => (
        <input key={id} type="hidden" name="selectedWorkSampleIds" value={id} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-[var(--gui-space-s)] text-sm text-muted-foreground">
        <span role="status">{saveState || "Szkic zapisuje się automatycznie"}</span>
        <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
          <Trash2 /> Usuń szkic
        </Button>
      </div>

      <section className="rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]">
        <StepHeading number="1" title="Wybierz dowody">
          Tylko zaznaczone elementy trafią do tej aplikacji i do asystenta AI.
        </StepHeading>
        <div className="mt-[var(--gui-space-m)] grid gap-[var(--gui-space-s)]">
          {[
            ...experiences.map((item) => ({ ...item, kind: "experience" as const })),
            ...workSamples.map((item) => ({ ...item, kind: "sample" as const })),
          ].map((item) => {
            const checked =
              item.kind === "experience"
                ? experienceIds.includes(item.id)
                : workSampleIds.includes(item.id);
            return (
              <label
                key={`${item.kind}-${item.id}`}
                className="flex cursor-pointer items-start gap-[var(--gui-space-s)] rounded-lg bg-background p-[var(--gui-space-m)]"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
                    item.kind === "experience"
                      ? toggle(experienceIds, setExperienceIds, item.id)
                      : toggle(workSampleIds, setWorkSampleIds, item.id)
                  }
                />
                <span>
                  <strong className="block font-medium">{item.title}</strong>
                  <span className="mt-[var(--gui-space-xxs)] block text-sm text-muted-foreground">
                    {item.subtitle}
                  </span>
                  {item.description && (
                    <span className="mt-[var(--gui-space-xxs)] block text-sm">
                      {item.description}
                    </span>
                  )}
                  {item.url && (
                    <span className="mt-[var(--gui-space-xxs)] block break-all text-sm">
                      {item.url}
                    </span>
                  )}
                  {item.outcome && (
                    <span className="mt-[var(--gui-space-xxs)] block text-sm">
                      Efekt: {item.outcome}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
          {experiences.length + workSamples.length === 0 && (
            <p className="rounded-lg bg-muted p-[var(--gui-space-m)] text-sm text-muted-foreground">
              Najpierw uzupełnij doświadczenie w profilu.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]">
        <StepHeading number="2" title="Napisz odpowiedź">
          Odwołaj się do własnej decyzji, odpowiedzialności i wyniku.
        </StepHeading>
        <div className="field mt-[var(--gui-space-m)]">
          <Label htmlFor="answer">Dlaczego pasujesz do tej roli?</Label>
          <Textarea
            id="answer"
            name="answer"
            rows={11}
            minLength={40}
            maxLength={5000}
            required
            value={answer}
            onChange={(event) => {
              discarding.current = false;
              setAnswer(event.target.value);
              if (!generationId) manualAnswer.current = event.target.value;
            }}
            placeholder="Opisz konkretne doświadczenie, decyzję i rezultat…"
          />
          <span className="text-xs text-muted-foreground">{answer.length}/5000 znaków</span>
        </div>
        {allowAi && (
          <div className="mt-[var(--gui-space-m)] rounded-lg bg-secondary p-[var(--gui-space-m)]">
            <div className="flex flex-wrap items-center gap-[var(--gui-space-s)]">
              <Button
                type="button"
                variant="outline"
                onClick={draftWithAi}
                disabled={aiBusy || !profileReady || evidenceCount === 0}
              >
                <Sparkles />
                {aiBusy
                  ? "Przygotowuję…"
                  : generationId
                    ? "Wygeneruj ponownie"
                    : "Przygotuj szkic z AI"}
              </Button>
              {generationId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAnswer(manualAnswer.current);
                    setGenerationId("");
                    setAiMessage("Szkic AI odrzucony. Wrócono do Twojej wersji.");
                  }}
                >
                  Odrzuć szkic AI
                </Button>
              )}
            </div>
            <p className="mt-[var(--gui-space-s)] text-sm text-muted-foreground">
              AI korzysta z opisu oferty, profilu i zaznaczonych wyżej materiałów. Sprawdź fakty
              przed wysłaniem. Asystent nie ocenia kandydatury, nie podejmuje decyzji o zatrudnieniu
              i niczego nie wysyła bez Twojej zgody.
            </p>
            {aiMessage && (
              <p role="status" className="mt-[var(--gui-space-xs)] text-sm">
                {aiMessage}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-card p-[var(--gui-space-l)] shadow-[var(--gui-shadow-m)]">
        <StepHeading number="3" title="Sprawdź i wyślij">
          Pracodawca otrzyma odpowiedź, zaznaczone wyżej materiały i profil w wersji z chwili
          wysłania.
        </StepHeading>
        <dl className="mt-[var(--gui-space-m)] grid gap-[var(--gui-space-s)] rounded-lg bg-secondary p-[var(--gui-space-m)] text-sm">
          <div className="flex justify-between gap-[var(--gui-space-m)]">
            <dt>Wybrane dowody</dt>
            <dd>{evidenceCount}</dd>
          </div>
          <div className="flex justify-between gap-[var(--gui-space-m)]">
            <dt>CV</dt>
            <dd>{cvFileName ?? "Nie dołączono"}</dd>
          </div>
          <div className="flex justify-between gap-[var(--gui-space-m)]">
            <dt>Odpowiedź</dt>
            <dd>{answer.trim().length >= 40 ? "Gotowa" : "Wymaga uzupełnienia"}</dd>
          </div>
          <div className="flex justify-between gap-[var(--gui-space-m)]">
            <dt>Źródło tekstu</dt>
            <dd>{generationId ? "Tekst przygotowany z pomocą AI" : "Tekst własny"}</dd>
          </div>
        </dl>
        <details className="mt-[var(--gui-space-m)] rounded-lg bg-secondary p-[var(--gui-space-m)]">
          <summary className="cursor-pointer font-medium">Profil przekazywany pracodawcy</summary>
          <p className="mt-[var(--gui-space-s)]">
            {profileSummary.displayName} · {profileSummary.headline}
          </p>
          <p className="mt-[var(--gui-space-xs)] text-sm">
            {profileSummary.city} · {profileSummary.years} lat doświadczenia
          </p>
          <p className="mt-[var(--gui-space-xs)] whitespace-pre-wrap text-sm">
            {profileSummary.bio}
          </p>
          {profileSummary.language && (
            <p className="mt-[var(--gui-space-xs)] text-sm">{profileSummary.language}</p>
          )}
        </details>
        <label className="mt-[var(--gui-space-m)] flex items-start gap-[var(--gui-space-xs)] text-sm">
          <Checkbox
            name="confirmed"
            value="yes"
            required
            onCheckedChange={(checked) => {
              if (checked)
                void captureBrowserAnalytics({
                  event: "application_reviewed",
                  properties: { jobId, usedAi: Boolean(generationId) },
                });
            }}
          />
          <span>
            Sprawdziłem / sprawdziłam odpowiedź i potwierdzam wysłanie aplikacji, wybranych dowodów
            oraz wskazanej wersji CV.
          </span>
        </label>
        {state.message && (
          <p role="alert" className="error-message mt-[var(--gui-space-m)]">
            {state.message}
          </p>
        )}
        <Button
          className="mt-[var(--gui-space-m)]"
          type="submit"
          size="lg"
          disabled={pending || !profileReady || evidenceCount === 0 || answer.trim().length < 40}
        >
          {pending ? (
            "Wysyłam…"
          ) : (
            <>
              <Check /> Wyślij aplikację
            </>
          )}
        </Button>
      </section>

      {!profileReady && (
        <p className="rounded-lg bg-muted p-[var(--gui-space-m)] text-sm">
          Profil nie jest jeszcze kompletny. Możesz zapisać szkic, ale przed wysłaniem uzupełnij
          opis i doświadczenie.
        </p>
      )}
      {cvFileName && (
        <p className="flex items-center gap-[var(--gui-space-xs)] text-sm text-muted-foreground">
          <FileText /> {cvFileName} pozostaje plikiem prywatnym do chwili wysłania aplikacji.
        </p>
      )}
    </form>
  );
}

function StepHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[var(--gui-space-s)]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {number}
      </span>
      <div>
        <h2>{title}</h2>
        <p className="mt-[var(--gui-space-xxs)] text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
