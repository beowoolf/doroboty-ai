import posthog from "posthog-js";

const token = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined;
const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined;

export const isPostHogConfigured = Boolean(token && apiHost);

let initialized = false;

export function initPostHog() {
  if (!isPostHogConfigured || typeof window === "undefined" || initialized) {
    return posthog;
  }

  posthog.init(token!, {
    api_host: apiHost!,
    defaults: "2026-01-30",
    // HashRouter: ręczne $pageview przy zmianie trasy.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    person_profiles: "identified_only",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-private], .ph-no-capture",
    },
  });

  initialized = true;
  return posthog;
}

export { posthog };
