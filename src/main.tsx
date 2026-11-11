import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import { App } from "./features/prototype/app";
import { initPostHog } from "./lib/posthog";
import "./app/globals.css";

const posthog = initPostHog();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
);
