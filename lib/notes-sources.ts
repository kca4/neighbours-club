/**
 * lib/notes-sources.ts — sourceId → human-readable publisher display name.
 *
 * Used at ProcessedNote creation time to populate the sourcePublisher field.
 * sourceId is the raw ingest key (e.g. "open-ottawa-road-events"); sourcePublisher is the
 * string shown to users and stored in attribution fields (e.g. "City of Ottawa (Traffic)").
 *
 * Add new entries here when a new ingest source is added to the cron.
 * Unknown sourceIds return null — the field is nullable; no crash.
 */

export const SOURCE_PUBLISHER_NAMES: Record<string, string> = {
  'open-ottawa-road-events': 'City of Ottawa (Traffic)',
  'open-ottawa-dev-apps':    'City of Ottawa (Dev Applications)',
}

/**
 * Returns the human-readable publisher name for a given sourceId,
 * or null if the sourceId is not in the map.
 */
export function getSourcePublisher(sourceId: string): string | null {
  return SOURCE_PUBLISHER_NAMES[sourceId] ?? null
}
