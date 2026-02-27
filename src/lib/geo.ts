/**
 * Geography utilities ported from TerraPin-main
 * Haversine distance, random coordinate generation, Street View lookup
 */

import type { Position } from "@/types/game";

/* ── Distance ────────────────────────────────────────────── */

function toRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

export function haversineDistance(a: Position, b: Position): number {
  const R = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km).toLocaleString()} km`;
}

/* ── Random coordinates (biased toward populated latitudes) ── */

function randomLat(min = -60, max = 70): number {
  return Math.random() * (max - min) + min;
}
function randomLng(min = -180, max = 180): number {
  return Math.random() * (max - min) + min;
}

export function generateRandomCoordinates(region = "world"): Position {
  switch (region) {
    case "europe":
      return { lat: randomLat(36, 71), lng: randomLng(-10, 40) };
    case "asia":
      return { lat: randomLat(-10, 55), lng: randomLng(60, 150) };
    case "americas":
      return { lat: randomLat(-55, 70), lng: randomLng(-170, -35) };
    default:
      return { lat: randomLat(), lng: randomLng() };
  }
}

/* ── Reverse-geocoding country check ─────────────────────── */

/** Reuse a single geocoder instance to avoid overhead */
let _geocoder: google.maps.Geocoder | null = null;
function getGeocoder(): google.maps.Geocoder | null {
  if (!window.google?.maps) return null;
  if (!_geocoder) _geocoder = new google.maps.Geocoder();
  return _geocoder;
}

/**
 * Uses Google's Geocoder to verify a position is inside the expected country.
 * Returns true if the country code of the location matches `expectedCode`.
 * On API failures (rate limit, network), returns true to avoid
 * discarding potentially valid locations.
 */
export async function isInCountry(
  pos: Position,
  expectedCode: string
): Promise<boolean> {
  const geocoder = getGeocoder();
  if (!geocoder) return true; // Can't verify — assume valid

  return new Promise((resolve) => {
    geocoder.geocode(
      { location: { lat: pos.lat, lng: pos.lng } },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
          // Rate limited — assume valid rather than discarding the location
          resolve(true);
          return;
        }
        if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
          // Network error or no results — assume valid
          resolve(true);
          return;
        }
        // Check address components for a country match
        for (const result of results) {
          for (const comp of result.address_components) {
            if (comp.types.includes("country")) {
              resolve(
                comp.short_name.toUpperCase() === expectedCode.toUpperCase()
              );
              return;
            }
          }
        }
        // No country component found — assume valid
        resolve(true);
      }
    );
  });
}

/* ── Street View location finder ────────────────────────── */

/**
 * Attempts to find a valid Street View panorama near the given coords.
 * Returns the snapped position + panoId, or null if none found.
 */
export async function findStreetViewAt(
  pos: Position,
  radius = 50_000
): Promise<{ lat: number; lng: number; panoId: string; name: string } | null> {
  if (!window.google?.maps) return null;

  const sv = new google.maps.StreetViewService();
  const latLng = new google.maps.LatLng(pos.lat, pos.lng);

  return new Promise((resolve) => {
    sv.getPanorama(
      {
        location: latLng,
        radius,
        source: google.maps.StreetViewSource.OUTDOOR,
        preference: google.maps.StreetViewPreference.NEAREST,
      },
      (
        data: google.maps.StreetViewPanoramaData | null,
        status: google.maps.StreetViewStatus
      ) => {
        if (
          status === google.maps.StreetViewStatus.OK &&
          data?.location?.latLng
        ) {
          resolve({
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
            panoId: data.location.pano || "",
            name: data.location.description || "Unknown location",
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Multi-attempt random Street View finder.
 * Tries `attempts` random coordinates until one has coverage.
 * Falls back to a curated demo location.
 */
export async function findRandomStreetViewLocation(
  region = "world",
  attempts = 15
): Promise<Position & { panoId?: string; name?: string }> {
  for (let i = 0; i < attempts; i++) {
    const coords = generateRandomCoordinates(region);
    const result = await findStreetViewAt(coords);
    if (result) return result;
  }

  // Fallback — curated locations known to have coverage
  const FALLBACKS: (Position & { name: string })[] = [
    { lat: 48.8566, lng: 2.3522, name: "Paris, France" },
    { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
    { lat: 40.7128, lng: -74.006, name: "New York, USA" },
    { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia" },
    { lat: 51.5074, lng: -0.1278, name: "London, UK" },
    { lat: 55.7558, lng: 37.6173, name: "Moscow, Russia" },
    { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro, Brazil" },
    { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  ];
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
