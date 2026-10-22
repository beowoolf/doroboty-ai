import { expect, it } from "vitest";
import { groupJobsByCoordinates, jobCountLabel } from "./map-groups";
import type { JobWithCompany } from "./types";

it("groups coincident pins without losing individual roles or inventing locations", () => {
  const jobs = [
    { id: "a", coordinates: { longitude: 21, latitude: 52 } },
    { id: "b", coordinates: { longitude: 21, latitude: 52 } },
    { id: "c", coordinates: { longitude: 19, latitude: 50 } },
    { id: "missing" },
  ] as JobWithCompany[];
  expect(groupJobsByCoordinates(jobs).map((group) => group.map((job) => job.id))).toEqual([
    ["a", "b"],
    ["c"],
  ]);
});

it("labels grouped offers using Polish plural forms", () => {
  expect([1, 2, 5, 12, 22].map(jobCountLabel)).toEqual([
    "1 oferta",
    "2 oferty",
    "5 ofert",
    "12 ofert",
    "22 oferty",
  ]);
});
