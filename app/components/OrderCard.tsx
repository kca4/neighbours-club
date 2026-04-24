import Link from "next/link";
import LeaveDealButton from "./LeaveDealButton";

type Order = {
  id: string;
  status: string;
  quantity: number;
  maxAuthorizedAmount: string | number;
  finalAmount: string | number | null;
  createdAt: string;
  pickedUpAt: string | null;
  deal: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    status: string;
    closesAt: string;
    pickupLocation: string;
    pickupWindowStart: string;
    pickupWindowEnd: string;
    tiers: { pricePerUnit: string | number }[];
    supplier: { name: string };
  };
};

function fmt(n: string | number | null) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    AUTHORIZED: { label: "Active", className: "bg-green-50 text-green-700" },
    CAPTURED: { label: "Charged", className: "bg-accent/10 text-accent" },
    PICKED_UP: { label: "Picked up", className: "bg-foreground/8 text-foreground/60" },
    VOIDED: { label: "Cancelled", className: "bg-red-50 text-red-700" },
    REFUNDED: { label: "Refunded", className: "bg-foreground/8 text-foreground/60" },
    NO_SHOW: { label: "No-show", className: "bg-foreground/8 text-foreground/60" },
    CAPTURE_FAILED: { label: "Charge failed", className: "bg-red-50 text-red-700" },
  };
  const s = map[status] ?? { label: status, className: "bg-foreground/8 text-foreground/60" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export default function OrderCard({ order }: { order: Order }) {
  const isActive =
    order.status === "AUTHORIZED" && order.deal.status === "OPEN";
  const tier1Price = order.deal.tiers[0]
    ? Number(order.deal.tiers[0].pricePerUnit)
    : 0;
  const likelyCharge = tier1Price * order.quantity;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-white p-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
            {order.deal.supplier.name}
          </div>
          <Link
            href={`/deals/${order.deal.slug}`}
            className="text-base font-semibold text-foreground hover:text-primary"
          >
            {order.deal.title}
          </Link>
        </div>
        {statusBadge(order.status)}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-foreground/50">Quantity</dt>
          <dd className="font-medium text-foreground">{order.quantity}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Max hold</dt>
          <dd className="font-medium text-foreground">
            {fmt(order.maxAuthorizedAmount)}
          </dd>
        </div>
        {isActive && tier1Price > 0 && (
          <div>
            <dt className="text-foreground/50">Likely charge</dt>
            <dd className="font-medium text-foreground">
              {fmt(likelyCharge)}{" "}
              <span className="text-xs font-normal text-foreground/40">
                at current tier
              </span>
            </dd>
          </div>
        )}
        {order.finalAmount !== null && (
          <div>
            <dt className="text-foreground/50">Final charge</dt>
            <dd className="font-medium text-foreground">
              {fmt(order.finalAmount)}
            </dd>
          </div>
        )}
        {isActive && (
          <div>
            <dt className="text-foreground/50">Deal closes</dt>
            <dd className="font-medium text-foreground">
              {fmtDate(order.deal.closesAt)}
            </dd>
          </div>
        )}
        {order.status === "CAPTURED" && (
          <div>
            <dt className="text-foreground/50">Pickup</dt>
            <dd className="font-medium text-foreground">
              {order.deal.pickupLocation}
            </dd>
          </div>
        )}
      </dl>

      {isActive && <LeaveDealButton slug={order.deal.slug} />}

      {order.status === "CAPTURED" && (
        <p className="text-sm text-foreground/60">
          Pickup window:{" "}
          {fmtDate(order.deal.pickupWindowStart)}–
          {fmtDate(order.deal.pickupWindowEnd)} at {order.deal.pickupLocation}
        </p>
      )}
    </div>
  );
}
