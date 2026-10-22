import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, MapPin, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/features/auth/session";
import {
  categoryLabels,
  contractLabels,
  functionLabels,
  publicationStatusLabel,
  remoteLabels,
  seniorityLabels,
} from "@/features/jobs/presentation";
import { getSupabaseConfig } from "@/lib/env";
import { cn } from "@/lib/utils";
import { JobDescription } from "@/features/jobs/job-description";

export const dynamic = "force-dynamic";

export default async function EmployerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!getSupabaseConfig().configured) return null;
  const { client, user, profile } = await requireProfile(["employer", "operator"]);
  const { id } = await params;
  const { data: job, error } = await client
    .from("jobs")
    .select(
      "id, company_id, slug, title, summary, description, category, function, remote_status, locations, seniority, contract_type, publication_status, verification_status, updated_at, brief:employer_briefs(source_text, decision_criteria)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !job) notFound();
  if (profile.role === "employer") {
    const { data: memberships, error: membershipError } = await client
      .from("organization_memberships")
      .select("organization:organizations(company_id)")
      .eq("user_id", user.id);
    if (membershipError) throw new Error("Nie udało się sprawdzić organizacji.");
    const ownsJob = (memberships ?? []).some((membership) => {
      const organization = Array.isArray(membership.organization)
        ? membership.organization[0]
        : membership.organization;
      return organization?.company_id === job.company_id;
    });
    if (!ownsJob) notFound();
  }
  const { data: versions, error: versionsError } = await client
    .from("job_text_versions")
    .select("id, version, title, summary, description, visibility, approved_at")
    .eq("job_id", job.id)
    .not("approved_at", "is", null)
    .order("version", { ascending: false });
  if (versionsError) throw new Error("Nie udało się wczytać zapisanych wersji.");
  const brief = Array.isArray(job.brief) ? job.brief[0] : job.brief;

  return (
    <div>
      <Link href="/app/oferty" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft className="size-4" /> Wróć do ofert firmy
      </Link>
      <div className="page-heading mt-5">
        <div>
          <p className="mb-2 flex items-center gap-2 font-ui text-sm text-muted-foreground">
            <BriefcaseBusiness className="size-4" /> Oferta firmy
          </p>
          <h1>{job.title}</h1>
          <p>{job.summary}</p>
        </div>
        <Badge variant="secondary">{publicationStatusLabel(job.publication_status)}</Badge>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link className={buttonVariants({ size: "sm" })} href={`/app/kandydaci?job=${job.id}`}>
          <UsersRound className="size-4" /> Kandydaci do tej oferty
        </Link>
        {job.publication_status === "published" ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={`/oferty/${job.slug}`}
          >
            Zobacz publiczną ofertę <ArrowUpRight className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="grid h-fit gap-6">
          <section className="rounded-xl bg-card p-6 shadow-[var(--gui-shadow-m)]">
            <h2>Treść oferty</h2>
            <div className="mt-4">
              <JobDescription description={job.description} />
            </div>
          </section>
          <section className="rounded-xl bg-card p-6 shadow-[var(--gui-shadow-m)]">
            <h2>Zapisane wersje</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Zatwierdzenie zapisuje wersję prywatną. Publikacja jest osobnym krokiem operatora; do
              tego czasu publiczna treść pozostaje bez zmian.
            </p>
            {versions?.length ? (
              versions.map((version) => (
                <details key={version.id} className="mt-4 rounded-lg bg-secondary p-4">
                  <summary className="cursor-pointer font-ui text-sm font-semibold">
                    Wersja {version.version} ·{" "}
                    {version.visibility === "private" ? "Prywatna" : "Publiczna"} · {version.title}
                  </summary>
                  <p className="my-4">{version.summary}</p>
                  <JobDescription description={version.description} />
                </details>
              ))
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nie ma jeszcze zatwierdzonych wersji.
              </p>
            )}
          </section>
        </div>
        <aside aria-label="Ustawienia i brief oferty" className="grid h-fit gap-6">
          <section className="rounded-xl bg-card p-5">
            <h2 className="text-xl">Ustawienia</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Meta
                label="Kategoria"
                value={categoryLabels[job.category as keyof typeof categoryLabels]}
              />
              <Meta
                label="Funkcja"
                value={functionLabels[job.function as keyof typeof functionLabels]}
              />
              <Meta
                label="Tryb pracy"
                value={remoteLabels[job.remote_status as keyof typeof remoteLabels]}
              />
              <Meta
                label="Poziom"
                value={seniorityLabels[job.seniority as keyof typeof seniorityLabels]}
              />
              <Meta
                label="Umowa"
                value={contractLabels[job.contract_type as keyof typeof contractLabels]}
              />
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-4" /> Lokalizacja
                </dt>
                <dd className="text-right font-medium">{job.locations.join(", ")}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl bg-secondary p-5">
            <h2 className="text-xl">Brief źródłowy</h2>
            {brief ? (
              <>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed">{brief.source_text}</p>
                <h3 className="mt-5 font-ui text-sm font-semibold">Kryteria decyzji</h3>
                <ul className="mt-2 grid gap-2">
                  {((brief.decision_criteria as string[]) ?? []).map((criterion) => (
                    <li key={criterion} className="pl-3 shadow-[var(--gui-accent-bar-shadow)]">
                      {criterion}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-muted-foreground">
                Brak briefu. Dodasz go w warsztacie na stronie ofert firmy.
              </p>
            )}
            <Link
              className={cn("mt-4", buttonVariants({ variant: "outline", size: "sm" }))}
              href={`/app/oferty?job=${job.id}#brief-source`}
            >
              {brief ? "Edytuj brief" : "Dodaj brief"}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
