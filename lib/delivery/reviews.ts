/**
 * lib/delivery/reviews.ts — Feature flag for restaurant ratings and review counts.
 *
 * REVIEWS_ENABLED must stay false until a real review-collection flow exists.
 * The Restaurant schema carries `rating` and `reviewCount` fields, but no
 * review-submission endpoint, review model, or moderation pipeline has been
 * built. Displaying those fields with REVIEWS_ENABLED = true would require a
 * genuine source of truth — third-party ratings or scraped data must NEVER
 * populate them, as that constitutes fabricated social proof.
 *
 * Gate every rating/reviewCount UI block on this constant so it cannot render
 * regardless of what is stored in the database. Flip to true only after a
 * real review flow is built and verified.
 */
export const REVIEWS_ENABLED = false;
