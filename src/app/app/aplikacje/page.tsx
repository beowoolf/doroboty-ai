import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MatchScore } from "@/features/applications/match-score-view";
import {
  applicationStatusClass,
  applicationStatusDescription,
  applicationStatusLabel,
} from "@/features/applications/presentation";
import { requireProfile } from "@/features/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const filters = [
  ["", "Wszystkie"],
  ["submitted", "Wysłane"],
  ["in_review", "W przeglądzie"],
  ["interview", "Rozmowy"],
  ["continued", "Kolejny etap"],
  ["completed", "Zakończone"],
  ["rejected", "Bez zatrudnienia"],
  ["hired", "Zatrudnienie"],
  ["withdrawn", "Wycofane"],
] as const;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; submitted?: string }>;
}) {
  const { client, user } = await requireProfile(["candidate"]);
  const query = await searchParams;
  const allowedStatus = filters.some(([value]) => value === query.status) ? query.status : "";
  let request = client
    .from("applications")
    .select(
      "id, status, variant, submitted_at, updated_at, answer, scores:fit_scores(id, score, version, calculated_at), job:jobs(title, slug), events:application_stage_events(stage, occurred_at)",
    )
    .eq("candidate_id", user.id)
    .order("submitted_at", { ascending: false });
  if (allowedStatus === "completed") request = request.in("status", ["rejected", "hired"]);
  else if (allowedStatus) request = request.eq("status", allowedStatus);
  const { data, error } = await request;
  if (error) throw new Error("Nie udało się wczytać aplikacji.");

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Twoje aplikacje</h1>
          <p>Sprawdzaj status, wysłane materiały i kolejne kroki.</p>
        </div>
        <Link className={buttonVariants({ variant: "outline" })} href="/oferty">
          Znajdź rolę
        </Link>
      </div>
      {query.submitted === "1" && (
        <div
          role="status"
          className="success-panel mb-[var(--gui-space-l)] flex items-center gap-[var(--gui-space-xs)]"
        >
          <CheckCircle2 className="size-5" /> Aplikacja została wysłana.
        </div>
      )}
      <nav
        aria-label="Filtr statusu aplikacji"
        className="mb-[var(--gui-space-l)] flex flex-wrap gap-[var(--gui-space-xs)]"
      >
        {filters.map(([value, label]) => (
          <Link
            key={value || "all"}
            className={cn(
              buttonVariants({
                variant: (allowedStatus ?? "") === value ? "default" : "outline",
                size: "sm",
              }),
            )}
            href={value ? `/app/aplikacje?status=${value}` : "/app/aplikacje"}
          >
            {label}
          </Link>
        ))}
      </nav>
      {(data ?? []).length === 0 ? (
        <div className="empty-state">
          <h2>{allowedStatus ? "Brak aplikacji z tym statusem" : "Nie masz jeszcze aplikacji"}</h2>
          <p>
            {allowedStatus
              ? "Wybierz inny filtr albo przejrzyj wszystkie zgłoszenia."
              : "Znajdź rolę i pokaż doświadczenie, które naprawdę ma znaczenie."}
          </p>
          <Link className="text-link" href={allowedStatus ? "/app/aplikacje" : "/oferty"}>
            {allowedStatus ? "Wszystkie aplikacje" : "Zobacz oferty"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-[var(--gui-space-m)]">
          {(data ?? []).map((application) => {
            const job = Array.isArray(application.job) ? application.job[0] : application.job;
            return (
              <article key={application.id} className="rounded-xl bg-card p-[var(--gui-space-m)]">
                <div className="flex flex-wrap items-start justify-between gap-[var(--gui-space-m)]">
                  <div>
                    <h2>
                      <Link
                        className="hover:text-[var(--gui-link)]"
                        href={`/app/aplikacje/${application.id}`}
                      >
                        {job?.title ?? "Oferta"}
                      </Link>
                    </h2>
                    <p className="mt-[var(--gui-space-xxs)] text-sm text-muted-foreground">
                      Wysłano{" "}
                      {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(
                        new Date(application.submitted_at),
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-[var(--gui-space-s)] py-[var(--gui-space-xxs)] text-xs font-medium",
                      applicationStatusClass(application.status),
                    )}
                  >
                    {applicationStatusLabel(application.status)}
                  </span>
                </div>
                <MatchScore compact scores={application.scores} />
                <p className="mt-[var(--gui-space-m)] text-sm text-muted-foreground">
                  {applicationStatusDescription(application.status)}
                </p>
                <div className="mt-[var(--gui-space-m)] flex flex-wrap gap-[var(--gui-space-m)]">
                  <Link className="text-link" href={`/app/aplikacje/${application.id}`}>
                    Szczegóły aplikacji
                  </Link>
                  {job?.slug && (
                    <Link className="text-link" href={`/oferty/${job.slug}`}>
                      Aktualna oferta
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
