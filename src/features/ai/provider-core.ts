export type AiPurpose = "job_draft" | "candidate_answer";

export type AiTextRequest = {
  purpose: AiPurpose;
  subjectId: string;
  source: Record<string, unknown>;
};

export const AI_POLICY = Object.freeze({
  hourlyRequestsPerSubject: 20,
  timeoutMs: 15_000,
  maxOutputCharacters: 30_000,
  maxAttempts: 1,
});

const quota = new Map<string, number[]>();

export function enforceAiQuota(subjectId: string, now = Date.now()) {
  const recent = (quota.get(subjectId) ?? []).filter((timestamp) => now - timestamp < 3_600_000);
  if (recent.length >= AI_POLICY.hourlyRequestsPerSubject) throw new Error("AI_QUOTA_EXCEEDED");
  recent.push(now);
  quota.set(subjectId, recent);
}

export function validateAiOutput(value: unknown) {
  if (typeof value !== "string") throw new Error("AI_PROVIDER_INVALID_OUTPUT");
  const text = value.trim();
  if (!text || text.length > AI_POLICY.maxOutputCharacters)
    throw new Error("AI_PROVIDER_INVALID_OUTPUT");
  return text;
}

export function estimateAiCostUsd(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  inputUsdPerMillion: number,
  outputUsdPerMillion: number,
) {
  const input = Math.max(0, inputTokens ?? 0);
  const output = Math.max(0, outputTokens ?? 0);
  return Number(
    ((input * inputUsdPerMillion + output * outputUsdPerMillion) / 1_000_000).toFixed(6),
  );
}

export function enforceAiCostLimit(estimatedCostUsd: number, maximumCostUsd: number) {
  if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd < 0)
    throw new Error("AI_PROVIDER_INVALID_COST");
  if (estimatedCostUsd > maximumCostUsd) throw new Error("AI_COST_LIMIT_EXCEEDED");
}

export function safeAiErrorCode(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") return "AI_PROVIDER_TIMEOUT";
  if (!(error instanceof Error)) return "AI_PROVIDER_FAILED";
  if (
    [
      "AI_QUOTA_EXCEEDED",
      "AI_PROVIDER_NOT_CONFIGURED",
      "AI_PROVIDER_EMPTY_OUTPUT",
      "AI_PROVIDER_INVALID_OUTPUT",
      "AI_PROVIDER_INVALID_COST",
      "AI_COST_LIMIT_EXCEEDED",
      "AI_PROVIDER_TIMEOUT",
    ].includes(error.message)
  )
    return error.message;
  if (/^AI_PROVIDER_HTTP_(429|5\d\d)$/.test(error.message)) return "AI_PROVIDER_UNAVAILABLE";
  return "AI_PROVIDER_FAILED";
}

export type AiAuditEntry = {
  event: "ai_generation";
  purpose: AiPurpose;
  provider: string;
  model: string;
  outcome: "succeeded" | "failed";
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  errorCode?: string;
};

export function aiAuditEntry(entry: Omit<AiAuditEntry, "event">): AiAuditEntry {
  return { event: "ai_generation", ...entry };
}

export function deterministicText(request: AiTextRequest) {
  if (request.purpose === "candidate_answer") {
    const jobTitle = String(request.source.jobTitle ?? "tej roli");
    const headline = String(request.source.headline ?? "specjalista produktu");
    const experience = Array.isArray(request.source.experiences)
      ? (request.source.experiences[0] as Record<string, unknown> | undefined)
      : undefined;
    const sample = Array.isArray(request.source.workSamples)
      ? (request.source.workSamples[0] as Record<string, unknown> | undefined)
      : undefined;
    const evidence = experience
      ? `${String(experience.title ?? "W poprzednim projekcie")} w ${String(experience.company_name ?? "zespole")}: ${String(experience.measurable_outcome ?? experience.description ?? "doprowadziłem pracę do mierzalnego wyniku")}`
      : sample
        ? `${String(sample.title ?? "Próbka pracy")}: ${String(sample.context ?? "")} ${String(sample.outcome ?? "")}`
        : String(request.source.bio ?? "");
    return `Jako ${headline} wnoszę do roli ${jobTitle} doświadczenie oparte na konkretnym dowodzie. ${evidence.trim().replace(/[.!?]+$/, "")}. Chcę podczas rozmowy pokazać tok decyzji, kompromisy i sposób mierzenia rezultatu, zamiast zastępować je ogólną deklaracją motywacji.`;
  }
  const title = String(request.source.title ?? "Specjalista AI");
  const criteria = Array.isArray(request.source.decisionCriteria)
    ? request.source.decisionCriteria.map(String).join(", ")
    : "samodzielność, współpraca i mierzalny efekt";
  return `${title}\n\nSzukamy osoby, która potrafi połączyć potrzeby użytkowników, decyzje produktowe i odpowiedzialne wykorzystanie AI. Najważniejsze kryteria tej roli to: ${criteria}.\n\nW pierwszych tygodniach poznasz kontekst zespołu, wybierzesz wartościowy problem i zaproponujesz sposób sprawdzenia rozwiązania z realnymi użytkownikami. Opisz w aplikacji własną odpowiedzialność, podjęte decyzje oraz mierzalny efekt wcześniejszej pracy.`;
}
