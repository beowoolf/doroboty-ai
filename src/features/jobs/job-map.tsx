"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import type { JobWithCompany } from "@/features/jobs/types";
import { formatSalary } from "@/features/jobs/presentation";
import { groupJobsByCoordinates, jobCountLabel } from "@/features/jobs/map-groups";

maplibregl.setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

export function JobMap({ jobs }: { jobs: JobWithCompany[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.dataset.mapState = "loading";
    const map = new maplibregl.Map({
      container,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [19.1451, 51.9194],
      zoom: 5.2,
      cooperativeGestures: true,
      attributionControl: false,
    });
    map.once("load", () => {
      container.dataset.mapState = "ready";
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: "OpenFreeMap" }),
      "bottom-right",
    );

    const bounds = new maplibregl.LngLatBounds();
    for (const group of groupJobsByCoordinates(jobs)) {
      const job = group[0];
      if (!job.coordinates) continue;
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "job-map-marker";
      marker.setAttribute(
        "aria-label",
        group.length > 1
          ? `${jobCountLabel(group.length)} · ${job.locations.join(" / ")}`
          : `${job.title}, ${job.company.name}`,
      );
      const markerLabel = document.createElement("span");
      markerLabel.textContent =
        group.length > 1
          ? String(group.length)
          : job.company.name
              .split(/\s+/)
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
      marker.append(markerLabel);

      const popupContent = document.createElement("div");
      popupContent.className = "job-map-popup";
      popupContent.style.maxHeight = "280px";
      popupContent.style.overflowY = "auto";
      for (const job of group) {
        const company = document.createElement("span");
        company.textContent = job.company.name;
        const title = document.createElement("a");
        title.className = "job-map-popup-title";
        title.href = `/oferty/${job.slug}`;
        title.textContent = job.title;
        const location = document.createElement("span");
        location.textContent = job.locations.join(" / ");
        const link = document.createElement("a");
        link.className = "job-map-popup-link";
        link.href = `/oferty/${job.slug}`;
        link.textContent = "Zobacz rolę →";
        popupContent.append(company, title, location, link);
      }

      const mapMarker = new maplibregl.Marker({ element: marker, anchor: "bottom" })
        .setLngLat([job.coordinates.longitude, job.coordinates.latitude])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setDOMContent(popupContent))
        .addTo(map);
      // MapLibre handles keypress while a native button also synthesizes click.
      // Own keydown to prevent an immediate open-and-close double activation.
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          mapMarker.togglePopup();
        }
      });
      bounds.extend([job.coordinates.longitude, job.coordinates.latitude]);
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 72, maxZoom: 8, duration: 0 });

    return () => {
      map.remove();
    };
  }, [jobs]);

  return (
    <section className="job-map-layout" aria-labelledby="job-map-title">
      <div className="job-map-list">
        <div className="p-5 shadow-[var(--gui-divider-bottom-shadow)]">
          <p className="text-xs font-medium text-muted-foreground">Wyniki na mapie</p>
          <h2 id="job-map-title" className="mt-1 text-xl">
            {jobs.length === 1 ? "1 lokalizacja" : `${jobs.length} lokalizacji`}
          </h2>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          {jobs.map((job) => (
            <article key={job.id} className="p-5 shadow-[var(--gui-divider-bottom-shadow)]">
              <p className="text-xs text-muted-foreground">{job.company.name}</p>
              <h3 className="mt-1 text-base font-semibold">
                <Link
                  className="rounded-sm transition-colors hover:text-[var(--gui-link)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gui-focus)]"
                  href={`/oferty/${job.slug}`}
                >
                  {job.title}
                </Link>
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {job.locations.join(" / ")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{formatSalary(job)}</p>
              <Link
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--gui-link)]"
                href={`/oferty/${job.slug}`}
              >
                Zobacz rolę <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="job-map-canvas"
        role="region"
        aria-label="Interaktywna mapa ofert pracy"
        data-map-state="loading"
      />
    </section>
  );
}
