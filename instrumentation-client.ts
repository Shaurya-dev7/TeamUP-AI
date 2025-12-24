"use client";

import posthog from "posthog-js";

// Prevent PostHog from ever initializing in a server-like environment.
// This avoids occasional Node-side network aborts (ECONNRESET) in dev.
if (typeof window !== "undefined") {
  try {
    posthog.init("phc_v1zGl740rSRNUNCouxKTzOdK31AIcRRWXNf4VMpfa4y", {
      api_host: "https://us.i.posthog.com",
      defaults: "2025-05-24",
    });
  } catch {
    // Ignore init failures (e.g., transient network issues in dev)
  }
}
