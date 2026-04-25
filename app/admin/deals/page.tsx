import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DealStatus, OrderStatus } from "@prisma/client";
import { DealStatusBadge } from "@/components/admin/StatusBadge";
import DealsFilter from "./DealsFilter";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusParam, q } = await searchParams;

  const statusFilter = statusParam
    ? { status: statusParam as DealStatus }
    : {};

  const deals = await prisma.deal.findMany({
    where: {
      ...statusFilter,
      ...(q
        ? { title: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
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
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/40">Admin / Deals</p>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
        </div>
        <Link href="/admin/deals/new" className="btn-primary">
          New deal
        </Link>
      </div>

      <DealsFilter currentStatus={statusParam} currentQ={q} />

      <div className="overflow-x-auto rounded-xl border border-foreground/10">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Members</th>
              <th>Opens</th>
              <th>Closes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-foreground/40">
                  No deals found.{" "}
                  <Link href="/admin/deals/new" className="text-accent hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            )}
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td className="font-medium">
                  <Link href={`/admin/deals/${deal.id}`} className="hover:text-accent">
                    {deal.title}
                  </Link>
                </td>
                <td className="text-foreground/60">{deal.supplier.name}</td>
                <td>
                  <DealStatusBadge status={deal.status} />
                </td>
                <td>{deal.orders.length}</td>
                <td className="text-sm text-foreground/60">
                  {new Date(deal.opensAt).toLocaleDateString("en-CA")}
                </td>
                <td className="text-sm text-foreground/60">
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
    </div>
  );
}
