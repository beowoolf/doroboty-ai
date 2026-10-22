import type { JobWithCompany } from "./types";

const plurals = new Intl.PluralRules("pl-PL");
export function jobCountLabel(count: number) {
  const word = { one: "oferta", few: "oferty", many: "ofert", other: "oferty" };
  return `${count} ${word[plurals.select(count) as keyof typeof word] ?? "ofert"}`;
}

/** Keep every role reachable when several offers share the same exact coordinates. */
export function groupJobsByCoordinates(jobs: JobWithCompany[]) {
  const groups = new Map<string, JobWithCompany[]>();
  for (const job of jobs) {
    if (!job.coordinates) continue;
    const key = `${job.coordinates.longitude}:${job.coordinates.latitude}`;
    const group = groups.get(key) ?? [];
    group.push(job);
    groups.set(key, group);
  }
  return [...groups.values()];
}
