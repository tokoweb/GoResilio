/**
 * Semantic Unit Conversion Utility
 * 
 * Provides explicit, deterministic conversions and formatting across domain metrics.
 * Eliminates silent, uncalibrated, or scattered mathematical divisions across the pipeline.
 */

/**
 * Converts meters to kilometers with null preservation.
 * @param meters Distance in meters (finite number or null/undefined)
 * @param decimals Optional decimal places (default: 2)
 */
export function metersToKilometers(meters: number | null | undefined, decimals = 2): number | null {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) {
    return null;
  }
  const km = meters / 1000;
  return Number(km.toFixed(decimals));
}

/**
 * Converts kilometers to meters with null preservation.
 * @param km Distance in kilometers (finite number or null/undefined)
 */
export function kilometersToMeters(km: number | null | undefined): number | null {
  if (km === null || km === undefined || !Number.isFinite(km)) {
    return null;
  }
  return Math.round(km * 1000);
}

/**
 * Converts seconds to minutes with null preservation.
 * @param seconds Duration in seconds (finite number or null/undefined)
 * @param roundUp Whether to round up (default: true for travel time safety)
 */
export function secondsToMinutes(seconds: number | null | undefined, roundUp = true): number | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return null;
  }
  return roundUp ? Math.ceil(seconds / 60) : Math.round(seconds / 60);
}

/**
 * Formats a metric distance in meters into a human-readable string (m or km).
 */
export function formatDistanceMeters(meters: number | null | undefined, isEn = false): string {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) {
    return isEn ? 'Data unavailable' : 'Data tidak tersedia';
  }
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  }
  return `±${Math.round(meters)} m`;
}

/**
 * Formats travel duration in minutes into a human-readable string.
 */
export function formatTravelTimeMinutes(minutes: number | null | undefined, isEn = false): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return isEn ? 'Data unavailable' : 'Data tidak tersedia';
  }
  return isEn ? `${Math.round(minutes)} mins` : `${Math.round(minutes)} menit`;
}
