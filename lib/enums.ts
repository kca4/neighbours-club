/**
 * Browser-safe enum constants mirroring the Prisma schema enums.
 * Import these in client components instead of @prisma/client.
 */

export const DealStatus = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  CLOSING_SUCCESS: "CLOSING_SUCCESS",
  CLOSING_FAILED: "CLOSING_FAILED",
  FULFILLING: "FULFILLING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const OrderStatus = {
  PENDING_AUTHORIZATION: "PENDING_AUTHORIZATION",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  CAPTURE_FAILED: "CAPTURE_FAILED",
  VOIDED: "VOIDED",
  PICKED_UP: "PICKED_UP",
  REFUNDED: "REFUNDED",
  NO_SHOW: "NO_SHOW",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
