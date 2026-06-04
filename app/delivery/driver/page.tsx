import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Car } from "lucide-react";
import Link from "next/link";
import DriverDashboard from "./DriverDashboard";

export default async function DriverPage() {
  const session = await auth();
  // Layout already redirects unauthenticated users; this is a type-safety guard.
  if (!session?.user?.id) return null;

  const driver = await prisma.deliveryDriver.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      activeOrderId: true,
      vehicleType: true,
    },
  });

  // ── Not registered as a driver ──────────────────────────────────────────────
  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 px-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8">
          <Car size={36} strokeWidth={1.5} className="text-primary/60" />
        </div>

        <div className="max-w-xs text-center">
          <h2
            className="text-2xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            You&apos;re not registered as a driver
          </h2>
          <p
            className="mt-3 text-sm leading-relaxed text-foreground/55"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Your account isn&apos;t set up for deliveries yet. Contact
            Neighbours Club support to get started.
          </p>
        </div>

        <Link
          href="/delivery"
          className="rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Back to delivery
        </Link>
      </div>
    );
  }

  return (
    <DriverDashboard
      driverId={driver.id}
      initialStatus={driver.status}
      activeOrderId={driver.activeOrderId}
      vehicleType={driver.vehicleType}
    />
  );
}
