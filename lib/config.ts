/**
 * Shared application constants.
 * Replace placeholder values with real ones before launch.
 */

/** Service fee charged per delivery order, in dollars. */
export const SERVICE_FEE = 1.49;

/**
 * Typical competitor delivery service fee, used to calculate customer savings.
 * Do not name any competitor explicitly in copy.
 */
export const TYPICAL_COMPETITOR_FEE = 5.0;

/**
 * Auto-accept queue threshold for Smart Accept in kitchen dashboard.
 * When active orders (incoming + cooking) reach this count, Smart Accept
 * switches to manual mode automatically.
 */
export const SMART_ACCEPT_THRESHOLD = 4;

/**
 * Delivery count shown in Driver-in-Chief byline across editorial content.
 * TODO: replace with real dynamic figure from database once tracked.
 */
export const DRIVER_IN_CHIEF_DELIVERIES = "1,200+";

/**
 * Customer support phone number shown in driver help panel.
 * TODO: replace with real support number before launch.
 */
export const SUPPORT_PHONE = "(613) 555-0100";

/**
 * Customer support email shown in driver help panel and elsewhere.
 * TODO: replace with real support email before launch.
 */
export const SUPPORT_EMAIL = "support@neighboursclub.ca";

/**
 * The day of the week restaurant partners receive payouts.
 * TODO: wire to actual Stripe Connect payout schedule.
 */
export const PAYOUT_DAY = "Friday";

/**
 * Background check provider identifier used during driver onboarding.
 * TODO: replace with real provider integration (e.g. Certn, Triton).
 */
export const BACKGROUND_CHECK_PROVIDER = "triton";

/**
 * Platform fee rate applied to restaurant payouts.
 * Used to calculate "You receive" in kitchen dashboard payout block.
 * E.g. 0.29 means platform takes 29% of order total (including payment processing).
 * TODO: replace with actual rate agreed with restaurant partners.
 */
export const PLATFORM_FEE_RATE = 0.29;
