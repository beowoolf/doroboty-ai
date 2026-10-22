"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/features/auth/session";
import { generateAiText } from "@/features/ai/provider";
import {
  candidateDraftRequestSchema,
  jobBriefSchema,
  jobDraftApprovalSchema,
  jobDraftSchema,
} from "@/features/ai/schema";
import { captureAnalytics } from "@/features/analytics/server";
import { authorizeAiTreatment } from "@/features/experiments/server";

export type CandidateDraftResult = {
  ok: boolean;
  message: string;
  text?: string;
  generationId?: string;
};

export async function generateCandidateDraft(input: {
  jobId: string;
  experienceIds: string[];
  workSampleIds: string[];
}): Promise<CandidateDraftResult> {
  const parsed = candidateDraftRequestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Wybierz dowody, na których ma oprzeć się szkic." };
  const { client, user, profile } = await requireProfile(["candidate"]);
  if (!(await authorizeAiTreatment(client, "candidate_answer", profile.role === "operator"))) {
    return { ok: false, message: "Ten wariant nie ma dostępu do szkicu AI." };
  }
  const [jobResult, candidateResult, experiencesResult, samplesResult] = await Promise.all([
    client
      .from("jobs")
      .select("id, title, summary, description")
      .eq("id", parsed.data.jobId)
      .eq("publication_status", "published")
      .single(),
    client.from("candidate_profiles").select("headline, bio").eq("user_id", user.id).single(),
    client
      .from("candidate_experiences")
      .select("id, title, company_name, description, measurable_outcome")
      .eq("user_id", user.id)
      .in(
        "id",
        parsed.data.experienceIds.length
          ? parsed.data.experienceIds
          : ["00000000-0000-0000-0000-000000000000"],
      ),
    client
      .from("candidate_work_samples")
      .select("id, title, context, outcome")
      .eq("user_id", user.id)
      .in(
        "id",
        parsed.data.workSampleIds.length
          ? parsed.data.workSampleIds
          : ["00000000-0000-0000-0000-000000000000"],
      ),
  ]);
  if (jobResult.error || !jobResult.data)
    return { ok: false, message: "Oferta nie jest dostępna." };
  if (
    candidateResult.error ||
    experiencesResult.error ||
    samplesResult.error ||
    (experiencesResult.data?.length ?? 0) !== parsed.data.experienceIds.length ||
    (samplesResult.data?.length ?? 0) !== parsed.data.workSampleIds.length ||
    (experiencesResult.data?.length ?? 0) + (samplesResult.data?.length ?? 0) === 0
  ) {
    return {
      ok: false,
      message: "Uzupełnij profil i dodaj doświadczenie przed wygenerowaniem szkicu.",
    };
  }
  const source = {
    jobTitle: jobResult.data.title,
    jobSummary: jobResult.data.summary,
    jobDescription: jobResult.data.description,
    ...candidateResult.data,
    experiences: experiencesResult.data ?? [],
    workSamples: samplesResult.data ?? [],
  };

  try {
    await captureAnalytics(user.id, {
      event: "ai_generation_started",
      properties: { jobId: parsed.data.jobId, purpose: "candidate_answer" },
    });
    const result = await generateAiText({
      purpose: "candidate_answer",
      subjectId: user.id,
      source,
    });
    const { data, error } = await client
      .from("ai_generations")
      .insert({
        purpose: "candidate_answer",
        requested_by: user.id,
        job_id: parsed.data.jobId,
        provider: result.provider,
        model: result.model,
        prompt_version: result.promptVersion,
        source_payload: source,
        output_text: result.text,
        latency_ms: result.latencyMs,
        input_tokens: result.inputTokens ?? null,
        output_tokens: result.outputTokens ?? null,
        estimated_cost_usd: result.estimatedCostUsd ?? null,
        status: "succeeded",
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: "Nie udało się zapisać pochodzenia szkicu." };
    await captureAnalytics(user.id, {
      event: "ai_generation_completed",
      properties: {
        jobId: parsed.data.jobId,
        purpose: "candidate_answer",
        outcome: "succeeded",
      },
    });
    return {
      ok: true,
      message: "Szkic gotowy. Sprawdź i popraw go przed wysłaniem.",
      text: result.text,
      generationId: data.id,
    };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "AI_GENERATION_FAILED";
    await client.from("ai_generations").insert({
      purpose: "candidate_answer",
      requested_by: user.id,
      job_id: parsed.data.jobId,
      provider: process.env.AI_PROVIDER ?? "deterministic",
      model: process.env.AI_MODEL ?? "course-fixture-v1",
      prompt_version: "evidence-first-v1",
      source_payload: source,
      output_text: null,
      latency_ms: 0,
      status: "failed",
      error_code: code,
    });
    await captureAnalytics(user.id, {
      event: "ai_generation_completed",
      properties: { jobId: parsed.data.jobId, purpose: "candidate_answer", outcome: "failed" },
    });
    return {
      ok: false,
      message:
        code === "AI_QUOTA_EXCEEDED"
          ? "Limit szkiców na tę godzinę został wykorzystany."
          : "Nie udało się przygotować szkicu. Możesz napisać odpowiedź samodzielnie.",
    };
  }
}

export type JobDraftState = {
  ok: boolean;
  message: string;
  generationId?: string;
  jobId?: string;
  title?: string;
  summary?: string;
  description?: string;
};

export type JobBriefState = { ok: boolean; message: string };

export async function saveJobBrief(
  _previous: JobBriefState,
  formData: FormData,
): Promise<JobBriefState> {
  const { client } = await requireProfile(["employer", "operator"]);
  const parsed = jobBriefSchema.safeParse({
    jobId: formData.get("jobId"),
    sourceText: formData.get("sourceText"),
    decisionCriteria: formData.get("decisionCriteria"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź brief." };
  }
  const { error } = await client.rpc("save_employer_job_brief", {
    target_job_id: parsed.data.jobId,
    brief_source_text: parsed.data.sourceText,
    brief_decision_criteria: parsed.data.decisionCriteria,
  });
  if (error) return { ok: false, message: "Nie udało się zapisać briefu źródłowego." };
  revalidatePath("/app/oferty");
  revalidatePath(`/app/oferty/${parsed.data.jobId}`);
  return { ok: true, message: "Brief źródłowy został zapisany." };
}

export async function generateJobDraft(
  _previous: JobDraftState,
  formData: FormData,
): Promise<JobDraftState> {
  const { client, user, profile } = await requireProfile(["employer", "operator"]);
  if (!(await authorizeAiTreatment(client, "employer_job_copy", profile.role === "operator"))) {
    return { ok: false, message: "Ten wariant nie ma dostępu do szkicu AI." };
  }
  const parsed = jobDraftSchema.safeParse({ jobId: formData.get("jobId") });
  if (!parsed.success) return { ok: false, message: "Wybierz ofertę." };
  const { data: job, error } = await client
    .from("jobs")
    .select("id, title, employer_brief_id, brief:employer_briefs(source_text, decision_criteria)")
    .eq("id", parsed.data.jobId)
    .single();
  if (error || !job) return { ok: false, message: "Nie masz dostępu do briefu tej oferty." };
  const brief = Array.isArray(job.brief) ? job.brief[0] : job.brief;
  if (!brief) return { ok: false, message: "Dodaj brief źródłowy przed generowaniem." };
  const source = {
    title: job.title,
    sourceText: brief.source_text,
    decisionCriteria: brief.decision_criteria,
  };
  try {
    await captureAnalytics(user.id, {
      event: "ai_generation_started",
      properties: { jobId: job.id, purpose: "job_draft" },
    });
    const result = await generateAiText({ purpose: "job_draft", subjectId: user.id, source });
    const [generatedTitle = job.title, ...body] = result.text.split("\n\n");
    const description = body.join("\n\n");
    const summary =
      description.split(".")[0]?.slice(0, 297).concat(".") ??
      `Rola ${job.title} oparta na konkretnych kryteriach.`;
    const { data: generation, error: insertError } = await client
      .from("ai_generations")
      .insert({
        purpose: "job_draft",
        requested_by: user.id,
        job_id: job.id,
        provider: result.provider,
        model: result.model,
        prompt_version: result.promptVersion,
        source_payload: source,
        output_text: result.text,
        latency_ms: result.latencyMs,
        status: "succeeded",
      })
      .select("id")
      .single();
    if (insertError || !generation) return { ok: false, message: "Nie udało się zapisać szkicu." };
    await captureAnalytics(user.id, {
      event: "ai_generation_completed",
      properties: { jobId: job.id, purpose: "job_draft", outcome: "succeeded" },
    });
    return {
      ok: true,
      message: "Szkic gotowy — wymaga Twojej akceptacji.",
      generationId: generation.id,
      jobId: job.id,
      title: generatedTitle,
      summary,
      description,
    };
  } catch {
    await captureAnalytics(user.id, {
      event: "ai_generation_completed",
      properties: { jobId: job.id, purpose: "job_draft", outcome: "failed" },
    });
    return { ok: false, message: "Nie udało się wygenerować szkicu." };
  }
}

export async function approveJobDraft(
  _previous: JobDraftState,
  formData: FormData,
): Promise<JobDraftState> {
  const { client, user } = await requireProfile(["employer", "operator"]);
  const parsed = jobDraftApprovalSchema.safeParse({
    jobId: formData.get("jobId"),
    generationId: formData.get("generationId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Sprawdź tekst." };
  const { data, error } = await client.rpc("approve_job_text_version", {
    target_job_id: parsed.data.jobId,
    target_generation_id: parsed.data.generationId,
    approved_title: parsed.data.title,
    approved_summary: parsed.data.summary,
    approved_description: parsed.data.description,
  });
  if (error) return { ok: false, message: "Nie udało się zatwierdzić wersji." };
  await captureAnalytics(user.id, {
    event: "ai_generation_approved",
    properties: { jobId: parsed.data.jobId, purpose: "job_draft" },
  });
  revalidatePath("/app/oferty");
  return { ok: true, message: `Zatwierdzono wersję ${data}.`, ...parsed.data };
}
