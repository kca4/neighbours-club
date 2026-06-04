/**
 * Human-readable labels for every CPReason value.
 *
 * Keeping labels here (rather than inline in UI components) means a new
 * reason added to the CPReason union only needs a label added in one place.
 * formatReason() falls back to a humanized version of the raw string so
 * the UI never silently shows a machine key if a label is missing.
 */
export const CP_REASON_LABELS: Record<string, string> = {
  verified_read:      'Read a local note',
  group_buy_reward:   'Group buy reward',
  tier_bridge:        'Tier bridge bonus',
  delivery_waiver:    'Delivery fee waiver',
  signup_bonus:       'Welcome bonus',
  secret_menu_redeem: 'Secret menu unlock',
  donation:           'Community donation',
}

/**
 * Returns a human-readable label for a ledger reason.
 * Falls back to title-casing the raw reason string (replacing underscores)
 * so an unmapped value still renders readably.
 */
export function formatReason(reason: string): string {
  return (
    CP_REASON_LABELS[reason] ??
    reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
