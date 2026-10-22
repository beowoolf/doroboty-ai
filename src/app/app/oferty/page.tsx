import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JobBriefForm } from "@/features/ai/job-brief-form";
import { JobDraftWorkspace } from "@/features/ai/job-draft-workspace";
import { ExperimentExposure } from "@/features/experiments/exposure";
import { requireProfile } from "@/features/auth/session";
import { getSupabaseConfig } from "@/lib/env";
import { EmployerJobForm } from "@/features/jobs/employer-job-form";
import { Badge } from "@/components/ui/badge";
import { publicationStatusLabel } from "@/features/jobs/presentation";

export const dynamic = "force-dynamic";

export default async function EmployerJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  if (!getSupabaseConfig().configured) return null;
  const { client, user, profile } = await requireProfile(["employer", "operator"]);
  let companyIds: string[] | null = null;
  if (profile.role === "employer") {
    const { data: memberships } = await client
      .from("organization_memberships")
      .select("organization:organizations(company_id)")
      .eq("user_id", user.id);
    companyIds = (memberships ?? []).flatMap((membership) => {
      const organization = Array.isArray(membership.organization)
        ? membership.organization[0]
        : membership.organization;
      return organization?.company_id ? [organization.company_id] : [];
    });
  }
  let query = client
    .from("jobs")
    .select(
      "id, slug, title, company_id, publication_status, updated_at, brief:employer_briefs(source_text, decision_criteria)",
    )
    .order("updated_at", { ascending: false });
  if (companyIds) query = query.in("company_id", companyIds);
  const { data, error } = await query;
  if (error) throw new Error("Nie udało się wczytać ofert firmy.");
  const { data: assignment, error: assignmentError } = await client.rpc("assign_experiment", {
    target_surface: "employer_job_copy",
  });
  if (assignmentError) throw new Error("Nie udało się przydzielić wariantu eksperymentu.");
  const treatment = assignment as { id: string; variant: "manual" | "ai_draft" };
  const allowAi = profile.role === "operator" || treatment.variant === "ai_draft";
  const jobsWithBrief = (data ?? []).map((job) => {
    const brief = Array.isArray(job.brief) ? job.brief[0] : job.brief;
    return {
      id: job.id,
      title: job.title,
      brief: brief
        ? {
            sourceText: brief.source_text,
            decisionCriteria: Array.isArray(brief.decision_criteria)
              ? (brief.decision_criteria as string[])
              : [],
          }
        : undefined,
    };
  });
  const requestedJob = (await searchParams).job;
  const selectedJobId =
    jobsWithBrief.find((job) => job.id === requestedJob)?.id ?? jobsWithBrief[0]?.id;

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Oferty firmy</h1>
          <p>Generuj z prywatnego briefu, edytuj i zatwierdzaj świadomie.</p>
        </div>
      </div>
      {profile.role === "employer" ? <EmployerJobForm /> : null}
      <section className="mt-8">
        <h2 className="text-xl">Twoje oferty</h2>
        <div className="mt-3 grid gap-2">
          {(data ?? []).map((job) => (
            <Link
              key={job.id}
              href={`/app/oferty/${job.id}`}
              className="flex items-center justify-between gap-4 rounded-lg bg-card p-4 shadow-[var(--gui-edge-shadow)]"
            >
              <span>
                <strong className="font-ui text-sm">{job.title}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Otwórz szczegóły i brief
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Badge variant="secondary">{publicationStatusLabel(job.publication_status)}</Badge>
                <ArrowRight className="size-4 text-muted-foreground" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="mt-10">
        {allowAi && profile.role !== "operator" && (
          <ExperimentExposure assignmentId={treatment.id} />
        )}
        <div id="brief-source" className="mb-6 scroll-mt-6">
          <JobBriefForm key={selectedJobId} jobs={jobsWithBrief} initialJobId={selectedJobId} />
        </div>
        <JobDraftWorkspace
          key={selectedJobId}
          jobs={jobsWithBrief}
          initialJobId={selectedJobId}
          allowAi={allowAi}
        />
      </div>
    </div>
  );
}
