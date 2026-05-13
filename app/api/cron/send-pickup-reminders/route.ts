/**
 * Pickup-reminder cron — POST /api/cron/send-pickup-reminders
 *
 * Runs hourly. Finds all CAPTURED orders whose pickup window starts within
 * the next 24-25 hours and hasn't had a reminder sent yet.
 *
 * Uses Order.pickupReminderSentAt to prevent resending (same pattern as
 * Deal.midpointReminderSentAt).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendPickupReminder } from "@/lib/email";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");

  const authorized =
    vercelCron === "1" ||
    (cronSecret && cronSecret === process.env.CRON_SECRET);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Window: pickup starts between 23 and 25 hours from now
  const windowStart = new Date(now.getTime() + 18 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.CAPTURED,
      pickupReminderSentAt: null,
      deal: {
        pickupWindowStart: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    },
    select: {
      id: true,
      user: { select: { email: true, name: true } },
      deal: {
        select: {
          title: true,
          pickupLocation: true,
          pickupAddress: true,
          pickupWindowStart: true,
          pickupWindowEnd: true,
          pickupInstructions: true,
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      await sendPickupReminder({
        to: order.user.email,
        memberName: order.user.name,
        dealTitle: order.deal.title,
        pickupLocation: order.deal.pickupLocation,
        pickupAddress: order.deal.pickupAddress,
        pickupWindowStart: order.deal.pickupWindowStart,
        pickupWindowEnd: order.deal.pickupWindowEnd,
        pickupInstructions: order.deal.pickupInstructions,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { pickupReminderSentAt: now },
      });

      sent++;
    } catch (err) {
      console.error("[send-pickup-reminders] Failed for order", order.id, err);
      failed++;
    }
  }

  return NextResponse.json({ processed: orders.length, sent, failed });
}
