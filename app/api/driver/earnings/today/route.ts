import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real earnings aggregation:
//   const today = startOfDay(new Date());
//   const deliveries = await prisma.deliveryOrder.findMany({
//     where: { driverId: session.user.id, status: "DELIVERED", deliveredAt: { gte: today } },
//     select: { driverPayout: true, tip: true },
//   });

export interface DriverEarningsToday {
  deliveries: number;
  basePay: number;
  tips: number;
  total: number;
  onlineMinutes: number;
}

const MOCK_EARNINGS: DriverEarningsToday = {
  deliveries: 0,
  basePay: 0,
  tips: 0,
  total: 0,
  onlineMinutes: 0,
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ earnings: MOCK_EARNINGS });
}
