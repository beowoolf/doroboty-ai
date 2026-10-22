"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  Eye,
  MessageSquareCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  recordEmployerStage,
  type EmployerStageActionState,
} from "@/features/applications/actions";

const initialState: EmployerStageActionState = { ok: false, message: "" };

type Stage =
  "reviewed" | "interview_invited" | "first_conversation_held" | "continued" | "rejected" | "hired";

function nextAction(status: string, lastStage?: string) {
  if (status === "submitted") {
    return { stage: "reviewed" as Stage, label: "Oznacz jako przejrzaną", icon: Eye };
  }
  if (status === "in_review") {
    return {
      stage: "interview_invited" as Stage,
      label: "Oznacz zaproszenie na rozmowę",
      icon: CalendarPlus,
    };
  }
  if (status === "interview" && lastStage !== "first_conversation_held") {
    return {
      stage: "first_conversation_held" as Stage,
      label: "Potwierdź odbytą rozmowę",
      icon: MessageSquareCheck,
    };
  }
  if (status === "interview") {
    return { stage: "continued" as Stage, label: "Przenieś do kolejnego etapu", icon: ArrowRight };
  }
  if (status === "continued") {
    return { stage: "hired" as Stage, label: "Oznacz jako zatrudnioną/-ego", icon: BadgeCheck };
  }
  return null;
}

export function CandidateStageActions({
  applicationId,
  status,
  lastStage,
}: {
  applicationId: string;
  status: string;
  lastStage?: string;
}) {
  const [state, action, pending] = useActionState(recordEmployerStage, initialState);
  const primary = nextAction(status, lastStage);
  const closed = status === "rejected" || status === "hired" || status === "withdrawn";

  return (
    <form action={action} className="mt-6 grid gap-4 pt-5 shadow-[var(--gui-divider-top-shadow)]">
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-sm text-muted-foreground">
        Zapisujesz etap procesu. Panel nie wysyła wiadomości ani zaproszeń — skontaktuj się z
        kandydatem poza aplikacją.
      </p>
      <div className="field">
        <Label htmlFor={`note-${applicationId}`}>Notatka do zmiany etapu (opcjonalnie)</Label>
        <Input
          id={`note-${applicationId}`}
          name="note"
          maxLength={2000}
          placeholder="Np. mocne doświadczenie w discovery"
        />
      </div>
      {closed ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4" /> Ten proces jest zakończony.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {primary ? (
            <Button type="submit" name="stage" value={primary.stage} disabled={pending}>
              <primary.icon className="size-4" />
              {pending ? "Zapisuję…" : primary.label}
            </Button>
          ) : null}
          <Button
            type="submit"
            name="stage"
            value="rejected"
            variant="secondary"
            disabled={pending}
          >
            <XCircle className="size-4 text-[var(--gui-error)]" /> Zakończ proces
          </Button>
        </div>
      )}
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
