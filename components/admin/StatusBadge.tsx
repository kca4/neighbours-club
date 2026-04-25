import { DealStatus, OrderStatus } from "@prisma/client";

const DEAL_COLORS: Record<DealStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSING_SUCCESS: "bg-blue-100 text-blue-800",
  CLOSING_FAILED: "bg-red-100 text-red-800",
  FULFILLING: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ORDER_COLORS: Record<OrderStatus, string> = {
  PENDING_AUTHORIZATION: "bg-yellow-100 text-yellow-800",
  AUTHORIZED: "bg-green-100 text-green-800",
  CAPTURED: "bg-blue-100 text-blue-800",
  CAPTURE_FAILED: "bg-red-100 text-red-800",
  VOIDED: "bg-gray-100 text-gray-600",
  PICKED_UP: "bg-purple-100 text-purple-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEAL_COLORS[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_COLORS[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
