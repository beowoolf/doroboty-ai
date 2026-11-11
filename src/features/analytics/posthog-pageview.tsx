import { useEffect } from "react";
import { useLocation } from "react-router";
import { isPostHogConfigured, posthog } from "@/lib/posthog";

/** Captures $pageview on HashRouter location changes. */
export function PostHogPageview() {
  const location = useLocation();

  useEffect(() => {
    if (!isPostHogConfigured) {
      return;
    }

    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
