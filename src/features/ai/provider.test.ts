import { describe, expect, it } from "vitest";
import {
  AI_POLICY,
  aiAuditEntry,
  deterministicText,
  enforceAiCostLimit,
  enforceAiQuota,
  estimateAiCostUsd,
  safeAiErrorCode,
  validateAiOutput,
} from "@/features/ai/provider-core";

describe("deterministic AI provider", () => {
  it("uses only supplied evidence and exposes provenance metadata", async () => {
    const text = deterministicText({
      purpose: "candidate_answer",
      subjectId: crypto.randomUUID(),
      source: {
        jobTitle: "AI Product Manager",
        headline: "Product Manager",
        experiences: [
          {
            title: "PM",
            company_name: "Fixture Labs",
            measurable_outcome: "Skróciłem proces o 20%.",
          },
        ],
      },
    });
    expect(text).toContain("Skróciłem proces o 20%");
    expect(text).not.toContain("..");
  });

  it("enforces the per-subject hourly quota", async () => {
    const subjectId = crypto.randomUUID();
    for (let index = 0; index < AI_POLICY.hourlyRequestsPerSubject; index += 1) {
      enforceAiQuota(subjectId, index);
    }
    expect(() => enforceAiQuota(subjectId, AI_POLICY.hourlyRequestsPerSubject)).toThrow(
      "AI_QUOTA_EXCEEDED",
    );
  });

  it("grounds a sample-only answer in the selected work instead of inventing experience", () => {
    const text = deterministicText({
      purpose: "candidate_answer",
      subjectId: crypto.randomUUID(),
      source: {
        headline: "Designer",
        jobTitle: "Product Designer",
        experiences: [],
        workSamples: [
          {
            title: "Prototyp",
            context: "Test z pięcioma osobami.",
            outcome: "Trzy osoby ukończyły zadanie.",
          },
        ],
      },
    });
    expect(text).toContain("Test z pięcioma osobami.");
    expect(text).toContain("Trzy osoby ukończyły zadanie.");
    expect(text).not.toContain("sprawdzonego wdrożenia");
  });

  it("rejects empty, non-text, and oversized provider output", () => {
    expect(() => validateAiOutput(42)).toThrow("AI_PROVIDER_INVALID_OUTPUT");
    expect(() => validateAiOutput("   ")).toThrow("AI_PROVIDER_INVALID_OUTPUT");
    expect(() => validateAiOutput("x".repeat(AI_POLICY.maxOutputCharacters + 1))).toThrow(
      "AI_PROVIDER_INVALID_OUTPUT",
    );
  });

  it("calculates and enforces a per-request cost limit", () => {
    const cost = estimateAiCostUsd(1_000, 500, 2, 8);
    expect(cost).toBe(0.006);
    expect(() => enforceAiCostLimit(cost, 0.005)).toThrow("AI_COST_LIMIT_EXCEEDED");
    expect(() => enforceAiCostLimit(cost, 0.01)).not.toThrow();
  });

  it("maps timeouts and outages to safe failure codes", () => {
    const timeout = new Error("request included private provider diagnostics");
    timeout.name = "AbortError";
    expect(safeAiErrorCode(timeout)).toBe("AI_PROVIDER_TIMEOUT");
    expect(safeAiErrorCode(new Error("AI_PROVIDER_HTTP_503"))).toBe("AI_PROVIDER_UNAVAILABLE");
    expect(safeAiErrorCode(new Error("sensitive upstream response"))).toBe("AI_PROVIDER_FAILED");
  });

  it("builds structured logs without source, prompt, output, or subject identifiers", () => {
    const entry = aiAuditEntry({
      purpose: "candidate_answer",
      provider: "deterministic",
      model: "course-fixture-v1",
      outcome: "succeeded",
      latencyMs: 4,
      estimatedCostUsd: 0,
    });
    expect(entry).toEqual({
      event: "ai_generation",
      purpose: "candidate_answer",
      provider: "deterministic",
      model: "course-fixture-v1",
      outcome: "succeeded",
      latencyMs: 4,
      estimatedCostUsd: 0,
    });
    expect(JSON.stringify(entry)).not.toMatch(/source|prompt|output|subject/i);
    expect(AI_POLICY.maxAttempts).toBe(1);
  });
});
