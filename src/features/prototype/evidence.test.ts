import { describe, expect, it } from "vitest";
import { evidenceCardFor } from "./evidence";
import { initialState } from "./model";

describe("evidenceCardFor", () => {
  it("returns prepared cards for seed BrightLabs applications", () => {
    const state = initialState();
    expect(state.applications).toHaveLength(3);
    for (const application of state.applications) {
      const card = evidenceCardFor(application);
      expect(card).not.toBeNull();
      expect(card!.questions.length).toBeGreaterThanOrEqual(2);
      expect(card!.evidences.length + card!.declarations.length).toBeGreaterThan(0);
    }
  });

  it("returns null for unknown applications", () => {
    expect(evidenceCardFor({ id: "missing", candidateId: "nobody" })).toBeNull();
  });
});
