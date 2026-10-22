import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, UserRoundSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MatchScore } from "@/features/applications/match-score-view";
import { buttonVariants } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { CandidateStageActions } from "@/features/applications/candidate-stage-actions";
import {
  applicationStatusClass,
  applicationStatusLabel,
} from "@/features/applications/presentation";
import { requireProfile } from "@/features/auth/session";
import { getSupabaseConfig } from "@/lib/env";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statuses = ["submitted", "in_review", "interview", "continued", "rejected", "hired"] as const;

export default async function EmployerInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; job?: string }>;
}) {
  if (!getSupabaseConfig().configured) return null;
  const { client, user, profile } = await requireProfile(["employer", "operator"]);
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number])
    ? params.status
    : undefined;

  let jobQuery = client.from("jobs").select("id, title, slug, company_id").order("title");
  if (profile.role === "employer") {
    const { data: memberships, error: membershipError } = await client
      .from("organization_memberships")
      .select("organization:organizations(company_id)")
      .eq("user_id", user.id);
    if (membershipError) throw new Error("Nie udało się wczytać organizacji.");
    const companyIds = (memberships ?? []).flatMap((membership) => {
      const organization = Array.isArray(membership.organization)
        ? membership.organization[0]
        : membership.organization;
      return organization?.company_id ? [organization.company_id] : [];
    });
    jobQuery = jobQuery.in("company_id", companyIds);
  }
  const { data: jobs, error: jobsError } = await jobQuery;
  if (jobsError) throw new Error("Nie udało się wczytać ofert do filtra.");
  const selectedJob = (jobs ?? []).some((job) => job.id === params.job) ? params.job : undefined;

  let query = client
    .from("applications")
    .select(
      "id, status, variant, answer, source_snapshot, submitted_at, job_id, scores:fit_scores(id, score, version, calculated_at), job:jobs(title, slug), events:application_stage_events(stage, occurred_at, note)",
    )
    .order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (selectedJob) query = query.eq("job_id", selectedJob);
  const { data, error } = await query;
  if (error) throw new Error("Nie udało się wczytać aplikacji pracodawcy.");

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Kandydaci</h1>
          <p>Aplikacje, źródłowe doświadczenie i decyzje dla Twojej organizacji.</p>
        </div>
        <span className="mode-label">
          {profile.role === "operator" ? "Widok operatora" : "Widok pracodawcy"}
        </span>
      </div>
      <form
        key={`${selectedJob ?? ""}:${status ?? ""}`}
        className="mb-6 grid gap-3 rounded-xl bg-secondary p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
      >
        <label className="font-ui text-sm font-medium">
          Ogłoszenie
          <FormSelect
            className="mt-1"
            name="job"
            ariaLabel="Filtruj po ogłoszeniu"
            defaultValue={selectedJob ?? ""}
            options={[
              { value: "", label: "Wszystkie ogłoszenia" },
              ...(jobs ?? []).map((job) => ({
                value: job.id,
                label: `${job.title} · ${job.slug}`,
              })),
            ]}
          />
        </label>
        <label className="font-ui text-sm font-medium">
          Status
          <FormSelect
            className="mt-1"
            name="status"
            ariaLabel="Filtruj po statusie"
            defaultValue={status ?? ""}
            options={[
              { value: "", label: "Wszystkie statusy" },
              ...statuses.map((item) => ({ value: item, label: applicationStatusLabel(item) })),
            ]}
          />
        </label>
        <button className={buttonVariants({ size: "sm" })} type="submit">
          Filtruj kandydatów
        </button>
      </form>
      {(data ?? []).length === 0 ? (
        <div className="empty-state">
          <UserRoundSearch className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2>Brak aplikacji dla tych filtrów</h2>
          <p>Zmień ogłoszenie albo status, aby zobaczyć pozostałych kandydatów.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {(data ?? []).map((application) => {
            const job = Array.isArray(application.job) ? application.job[0] : application.job;
            const snapshot = application.source_snapshot as {
              profile?: { displayName?: string; headline?: string };
              experiences?: {
                title: string;
                company_name: string;
                measurable_outcome?: string;
              }[];
            };
            const events = [...(application.events ?? [])].sort(
              (left, right) =>
                new Date(left.occurred_at).getTime() - new Date(right.occurred_at).getTime(),
            );
            const lastStage = events.at(-1)?.stage;
            return (
              <article
                key={application.id}
                className="rounded-xl bg-card p-6 shadow-[var(--gui-shadow-m)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-ui text-xs font-semibold text-muted-foreground">
                      <BriefcaseBusiness className="size-3.5" /> {job?.title}
                    </p>
                    <h2 className="mt-1">
                      <Link className="hover:underline" href={`/app/kandydaci/${application.id}`}>
                        {snapshot.profile?.displayName || "Kandydat / kandydatka"}
                      </Link>
                    </h2>
                    <p className="mt-1">{snapshot.profile?.headline}</p>
                  </div>
                  <Badge className={applicationStatusClass(application.status)}>
                    {applicationStatusLabel(application.status)}
                  </Badge>
                </div>
                <MatchScore compact scores={application.scores} />
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section>
                    <h3 className="font-ui font-semibold">Odpowiedź</h3>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-lg leading-relaxed">
                      {application.answer}
                    </p>
                  </section>
                  <section>
                    <h3 className="font-ui font-semibold">Najważniejsze doświadczenie</h3>
                    <ul className="mt-2 grid gap-2">
                      {(snapshot.experiences ?? []).slice(0, 2).map((experience, index) => (
                        <li
                          key={`${experience.title}-${index}`}
                          className="pl-3 shadow-[var(--gui-accent-bar-shadow)]"
                        >
                          <strong>
                            {experience.title} · {experience.company_name}
                          </strong>
                          {experience.measurable_outcome ? (
                            <p>{experience.measurable_outcome}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                <Link
                  className={cn("mt-5", buttonVariants({ variant: "outline", size: "sm" }))}
                  href={`/app/kandydaci/${application.id}`}
                >
                  Zobacz profil i CV <ArrowRight className="size-4" />
                </Link>
                <CandidateStageActions
                  applicationId={application.id}
                  status={application.status}
                  lastStage={lastStage}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
