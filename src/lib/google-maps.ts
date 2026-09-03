/**
 * Google Maps API loader for Next.js
 * Loads the script once and provides a promise-based API
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

/** Give up if `window.google.maps` hasn't appeared within this window. */
const LOAD_TIMEOUT_MS = 15_000;

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  // Already loaded
  if (window.google?.maps) return Promise.resolve();

  // Loading in progress
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (poll) clearInterval(poll);
      if (timeout) clearTimeout(timeout);
      if (err) {
        // Clear the cache so a later call can retry instead of replaying
        // this rejection forever.
        loadPromise = null;
        reject(err);
      } else {
        resolve();
      }
    };

    if (!GOOGLE_MAPS_API_KEY) {
      finish(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set."));
      return;
    }

    // One poll + one deadline covers both the "script already exists" case and
    // the one we append below, so neither path can hang forever.
    poll = setInterval(() => {
      if (window.google?.maps) finish();
    }, 50);
    timeout = setTimeout(
      () =>
        finish(
          new Error(
            "Google Maps failed to load within 15s. Check the API key and its HTTP-referrer restrictions."
          )
        ),
      LOAD_TIMEOUT_MS
    );

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => finish(new Error("Failed to load Google Maps API"));
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== "undefined" && !!window.google?.maps;
}
