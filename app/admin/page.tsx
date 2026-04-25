import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DealStatus, OrderStatus, Role } from "@prisma/client";
import { DealStatusBadge, OrderStatusBadge } from "@/components/admin/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [
    draftCount,
    openCount,
    fulfillingCount,
    memberCount,
    activeOrderCount,
    recentDeals,
    recentOrders,
  ] = await Promise.all([
    prisma.deal.count({ where: { status: DealStatus.DRAFT } }),
    prisma.deal.count({ where: { status: DealStatus.OPEN } }),
    prisma.deal.count({ where: { status: DealStatus.FULFILLING } }),
    prisma.user.count({ where: { role: Role.MEMBER } }),
    prisma.order.count({
      where: {
        deal: { status: DealStatus.OPEN },
        status: { in: [OrderStatus.AUTHORIZED, OrderStatus.PENDING_AUTHORIZATION] },
      },
    }),
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { name: true } },
        orders: {
          where: {
            status: {
              in: [OrderStatus.AUTHORIZED, OrderStatus.CAPTURED, OrderStatus.PICKED_UP],
            },
          },
          select: { id: true },
        },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        deal: { select: { title: true } },
      },
    }),
  ]);

  const tiles = [
    { label: "Draft deals", value: draftCount, href: "/admin/deals?status=DRAFT", color: "bg-gray-50" },
    { label: "Open deals", value: openCount, href: "/admin/deals?status=OPEN", color: "bg-green-50" },
    { label: "Fulfilling", value: fulfillingCount, href: "/admin/deals?status=FULFILLING", color: "bg-orange-50" },
    { label: "Members", value: memberCount, href: "/admin/deals", color: "bg-blue-50" },
    { label: "Active orders", value: activeOrderCount, href: "/admin/deals?status=OPEN", color: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground/50">Neighbours Club admin overview</p>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(({ label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-xl ${color} border border-foreground/10 p-4 transition-shadow hover:shadow-sm`}
          >
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-foreground/60">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent deals */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent deals</h2>
          <Link href="/admin/deals" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Members joined</th>
                <th>Closes at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-foreground/40">
                    No deals yet
                  </td>
                </tr>
              )}
              {recentDeals.map((deal) => (
                <tr key={deal.id}>
                  <td className="font-medium">{deal.title}</td>
                  <td>
                    <DealStatusBadge status={deal.status} />
                  </td>
                  <td>{deal.orders.length}</td>
                  <td className="text-foreground/60">
                    {new Date(deal.closesAt).toLocaleDateString("en-CA")}
                  </td>
                  <td>
                    <Link
                      href={`/admin/deals/${deal.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <h2 className="mb-3 font-semibold text-foreground">Recent orders</h2>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Deal</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-foreground/40">
                    No orders yet
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.user.name}</td>
                  <td className="text-foreground/70">{order.deal.title}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="text-foreground/60">
                    {new Date(order.createdAt).toLocaleDateString("en-CA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
