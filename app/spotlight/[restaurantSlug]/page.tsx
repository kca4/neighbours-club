import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpotlightView from "./SpotlightView";
import type { SpotlightData } from "@/app/api/spotlight/[restaurantSlug]/route";

async function fetchSpotlight(slug: string): Promise<SpotlightData | null> {
  // TODO: replace with real API call / direct DB query in production
  const mod = await import("@/app/api/spotlight/[restaurantSlug]/route");
  // Re-use mock data map directly for SSR
  const { GET } = mod;
  const req = new Request(`http://localhost/api/spotlight/${slug}`);
  const res = await GET(req as any, { params: Promise.resolve({ restaurantSlug: slug }) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.spotlight ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const spotlight = await fetchSpotlight(restaurantSlug);
  if (!spotlight) return { title: "Not Found" };
  return {
    title: `${spotlight.name} · Partner Spotlight`,
    description: spotlight.tagline,
  };
}

export default async function SpotlightPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const spotlight = await fetchSpotlight(restaurantSlug);
  if (!spotlight) notFound();

  return <SpotlightView spotlight={spotlight} />;
}
