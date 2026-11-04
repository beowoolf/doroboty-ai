import { z } from "zod";
import evidenceFixture from "./data/evidence.json" with { type: "json" };

const itemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  source: z.string().min(1),
});

export const evidenceCardSchema = z.object({
  applicationId: z.string().min(1),
  candidateId: z.string().min(1),
  blurb: z.string().min(1),
  evidences: z.array(itemSchema).min(0).max(12),
  declarations: z.array(itemSchema).min(0).max(12),
  questions: z.array(z.string().min(1)).min(1).max(6),
});

export type EvidenceCardData = z.infer<typeof evidenceCardSchema>;

const cards = z.array(evidenceCardSchema).parse(evidenceFixture);

export function evidenceCardFor(application: {
  id: string;
  candidateId: string;
}): EvidenceCardData | null {
  return (
    cards.find((card) => card.applicationId === application.id) ??
    cards.find((card) => card.candidateId === application.candidateId) ??
    null
  );
}
