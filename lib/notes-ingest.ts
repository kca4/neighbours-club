import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";

type OpenOttawaMapResult = {
  title: string;
  body: string;
  sourceUrl: string;
  publishedAt: Date | null;
};

const KANATA_KEYWORDS = [
  "kanata",
  "stittsville",
  "hazeldean",
  "terry fox",
  "march road",
  "campeau",
  "kanata north",
  "kanata south",
  "morgan's grant",
  "bridlewood",
  "beaverbrook",
  "katimavik",
  "castlefrank",
  "palladium",
  "canadian tire centre",
  "teron",
  "kakulu",
  "legget",
  "herzberg",
  "innovation drive",
  "eagleson",
];

export function isKanataRelevant(title: string, body: string): boolean {
  const text = `${title} ${body}`.toLowerCase();
  return KANATA_KEYWORDS.some((kw) => text.includes(kw));
}

export async function ingestRSSFeed(
  feedUrl: string,
  sourceId: string
): Promise<{ inserted: number; skipped: number }> {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);

  const total = feed.items.length;

  const relevantItems = feed.items
    .map((item) => {
      const sourceUrl = item.link ?? item.guid;
      if (!sourceUrl) return null;
      const title = item.title ?? "";
      const body = item.content ?? item.contentSnippet ?? "";
      if (!isKanataRelevant(title, body)) return null;
      const publishedAt = item.pubDate ? new Date(item.pubDate) : null;
      return { sourceId, sourceUrl, title, body, publishedAt, processed: false };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (relevantItems.length === 0) {
    return { inserted: 0, skipped: total };
  }

  const { count } = await prisma.rawIntel.createMany({
    data: relevantItems,
    skipDuplicates: true,
  });

  return { inserted: count, skipped: total - count };
}

export async function ingestOpenOttawa(
  endpoint: string,
  sourceId: string,
  mapFn: (item: any) => OpenOttawaMapResult | null,
  extractItems: (json: any) => any[] = (json) =>
    json.events ?? json.features ?? (Array.isArray(json) ? json : [])
): Promise<{ inserted: number; skipped: number }> {
  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${endpoint}`);
  const json = await res.json();

  const items = extractItems(json);
  const total = items.length;

  const relevantItems = items
    .map((item) => {
      const mapped = mapFn(item);
      if (!mapped) return null;
      const { title, body, sourceUrl, publishedAt } = mapped;
      if (!isKanataRelevant(title, body)) return null;
      return { sourceId, sourceUrl, title, body, publishedAt, processed: false };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (relevantItems.length === 0) {
    return { inserted: 0, skipped: total };
  }

  const { count } = await prisma.rawIntel.createMany({
    data: relevantItems,
    skipDuplicates: true,
  });

  return { inserted: count, skipped: total - count };
}
