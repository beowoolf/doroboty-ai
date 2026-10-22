"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/features/auth/session";
import { employerJobSchema } from "@/features/jobs/employer-job-schema";

export type EmployerJobActionState = {
  ok: boolean;
  message: string;
  jobId?: string;
  values?: Record<string, string>;
  field?: string;
  revision?: number;
};

export async function createEmployerJob(
  previous: EmployerJobActionState,
  formData: FormData,
): Promise<EmployerJobActionState> {
  const { client } = await requireProfile(["employer"]);
  const fields = [
    "slug",
    "title",
    "summary",
    "description",
    "category",
    "function",
    "remoteStatus",
    "locations",
    "seniority",
    "contractType",
    "salaryMin",
    "salaryMax",
    "salaryCurrency",
    "salaryPeriod",
    "salaryKind",
    "expiryAt",
    "sourceBrief",
    "decisionCriteria",
  ];
  const values = Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  const revision = (previous.revision ?? 0) + 1;
  const parsed = employerJobSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    category: formData.get("category"),
    function: formData.get("function"),
    remoteStatus: formData.get("remoteStatus"),
    locations: formData.get("locations"),
    seniority: formData.get("seniority"),
    contractType: formData.get("contractType"),
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    salaryCurrency: formData.get("salaryCurrency") || undefined,
    salaryPeriod: formData.get("salaryPeriod") || undefined,
    salaryKind: formData.get("salaryKind") || undefined,
    expiryAt: formData.get("expiryAt") || "",
    sourceBrief: formData.get("sourceBrief") || "",
    decisionCriteria: formData.get("decisionCriteria") || "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Sprawdź formularz.",
      field: String(parsed.error.issues[0]?.path[0] ?? "title"),
      values,
      revision,
    };
  }

  const input = parsed.data;
  const hasSalary = input.salaryMin !== undefined && input.salaryMax !== undefined;
  const { data, error } = await client.rpc("create_employer_job_with_brief", {
    job_slug: input.slug,
    job_title: input.title,
    job_summary: input.summary,
    job_description: input.description,
    job_category: input.category,
    job_function: input.function,
    job_remote_status: input.remoteStatus,
    job_locations: input.locations,
    job_seniority: input.seniority,
    job_contract_type: input.contractType,
    job_salary_min: hasSalary ? input.salaryMin : null,
    job_salary_max: hasSalary ? input.salaryMax : null,
    job_salary_currency: hasSalary ? (input.salaryCurrency ?? "PLN") : null,
    job_salary_period: hasSalary ? (input.salaryPeriod ?? "month") : null,
    job_salary_kind: hasSalary ? (input.salaryKind ?? "gross") : null,
    job_expiry_at: input.expiryAt ? `${input.expiryAt}T23:59:59.000Z` : null,
    job_map_latitude: null,
    job_map_longitude: null,
    job_source_text: input.sourceBrief ?? "",
    job_decision_criteria: input.decisionCriteria ?? [],
  });
  if (error) {
    return {
      ok: false,
      values,
      revision,
      field: error.message.includes("duplicate") ? "slug" : undefined,
      message: error.message.includes("duplicate")
        ? "Ten adres oferty jest już zajęty. Zmień slug."
        : "Nie udało się zapisać oferty.",
    };
  }
  revalidatePath("/app/oferty");
  return { ok: true, message: "Oferta trafiła do weryfikacji.", jobId: String(data), revision };
}
