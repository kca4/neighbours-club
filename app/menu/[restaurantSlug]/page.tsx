import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuView from "./MenuView";
import type { RestaurantMenuData } from "@/app/api/menu/[restaurantSlug]/route";

async function fetchMenu(slug: string): Promise<RestaurantMenuData | null> {
  // TODO: replace with direct prisma query in production
  const mod = await import("@/app/api/menu/[restaurantSlug]/route");
  const req = new Request(`http://localhost/api/menu/${slug}`);
  const res = await mod.GET(req as any, {
    params: Promise.resolve({ restaurantSlug: slug }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.menu ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const menu = await fetchMenu(restaurantSlug);
  if (!menu) return { title: "Not Found" };
  return {
    title: `${menu.name} · Menu`,
    description: `${menu.cuisine} · Order from ${menu.name} on Neighbours Club`,
  };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const menu = await fetchMenu(restaurantSlug);
  if (!menu) notFound();

  return <MenuView menu={menu} />;
}
