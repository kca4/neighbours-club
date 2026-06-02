import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const now = Date.now();

function ago(d) {
  if (!d) return "—";
  const s = Math.round((now - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}min ago`;
}

const users = await prisma.user.findMany({
  orderBy: { createdAt: "asc" },
  select: { id: true, email: true, role: true, name: true },
});

console.log("\n── USERS ──────────────────────────────────────────────────────");
console.log("email                              | role             | name              | id");
console.log("───────────────────────────────────|──────────────────|───────────────────|────────");
for (const u of users) {
  console.log(`${u.email.padEnd(34)}| ${u.role.padEnd(17)}| ${u.name.padEnd(18)}| ${u.id.slice(0,8)}`);
}

const drivers = await prisma.deliveryDriver.findMany({
  include: { user: { select: { email: true } } },
  orderBy: { createdAt: "asc" },
});

console.log("\n── DELIVERY DRIVERS ────────────────────────────────────────────");
console.log("user email              | status       | vehicleType | activeOrderId");
console.log("────────────────────────|──────────────|─────────────|─────────────");
for (const d of drivers) {
  console.log(
    `${d.user.email.padEnd(23)} | ${d.status.padEnd(12)} | ${d.vehicleType.padEnd(11)} | ${d.activeOrderId ? d.activeOrderId.slice(0,8) : "—"}`
  );
}

const orders = await prisma.deliveryOrder.findMany({
  include: { restaurant: { select: { name: true } } },
  orderBy: { createdAt: "asc" },
});

console.log("\n── DELIVERY ORDERS ─────────────────────────────────────────────────────────────────────────────────────");
console.log("id       | restaurant         | status             | fulfillType   | driverId | dispatchStartedAt | stripePI");
console.log("─────────|────────────────────|────────────────────|───────────────|──────────|───────────────────|─────────");
for (const o of orders) {
  console.log(
    `${o.id.slice(0,8)} | ${o.restaurant.name.slice(0,18).padEnd(18)} | ${o.status.padEnd(18)} | ${o.fulfillmentType.padEnd(13)} | ${(o.driverId ?? "—").slice(0,8).padEnd(8)} | ${ago(o.dispatchStartedAt).padEnd(17)} | ${o.stripePaymentIntentId ?? "—"}`
  );
}

await prisma.$disconnect();
