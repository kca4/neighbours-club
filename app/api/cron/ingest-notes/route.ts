import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestRSSFeed, ingestOpenOttawa } from "@/lib/notes-ingest";
import { summarizeNewsItem } from "@/lib/notes-intelligence";
import { generateNoteSlug } from "@/lib/slugify";

const SOURCES = [
  {
    feedUrl: "https://www.cbc.ca/cmlink/rss-canada-ottawa",
    sourceId: "cbc-ottawa",
  },
  {
    feedUrl: "https://ottawacitizen.com/feed",
    sourceId: "ottawa-citizen",
  },
];

const API_SOURCES = [
  {
    endpoint: "https://traffic.ottawa.ca/map/service/events?accept-language=en",
    sourceId: "open-ottawa-road-events",
    mapFn: (item: any) => {
      const title = item.headline ?? item.eventType ?? "Road Event";
      const body = [item.message, item.cause].filter(Boolean).join(" — ");
      const sourceUrl = `https://traffic.ottawa.ca/map/service/events#${item.id}`;
      const publishedAt = item.created ? new Date(item.created) : null;
      if (!title && !body) return null;
      return { title, body, sourceUrl, publishedAt };
    },
    extractItems: (json: any) => json.events ?? [],
  },
  {
    endpoint:
      "https://maps.ottawa.ca/arcgis/rest/services/Development_Applications/MapServer/0/query" +
      "?where=1%3D1&outFields=*&f=json&resultRecordCount=100&orderByFields=APPLICATION_DATE+DESC",
    sourceId: "open-ottawa-dev-apps",
    mapFn: (item: any) => {
      const a = item.attributes;
      if (!a) return null;
      const title = `${a.APPLICATION_TYPE_EN ?? "Application"}: ${a.ADDRESS_NUMBER_ROAD_NAME ?? "unknown address"}`;
      const body = [
        a.WARD_NUMBER_EN,
        a.OBJECT_CURRENT_STATUS_EN,
        `Application #${a.APPLICATION_NUMBER}`,
      ]
        .filter(Boolean)
        .join(". ");
      const sourceUrl = `https://maps.ottawa.ca/arcgis/rest/services/Development_Applications/MapServer/0/query#${a.APPLICATION_NUMBER}`;
      const publishedAt = a.APPLICATION_DATE ? new Date(a.APPLICATION_DATE) : null;
      return { title, body, sourceUrl, publishedAt };
    },
    extractItems: (json: any) => json.features ?? [],
  },
];

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");
  const authorized =
    vercelCron === "1" ||
    (cronSecret && cronSecret === process.env.CRON_SECRET);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 1: Ingest all feeds
  let feedsProcessed = 0;
  let itemsIngested = 0;
  const feedErrors: { sourceId: string; error: string }[] = [];
  for (const source of SOURCES) {
    try {
      const result = await ingestRSSFeed(source.feedUrl, source.sourceId);
      feedsProcessed++;
      itemsIngested += result.inserted;
    } catch (err) {
      console.error(`[ingest-notes] Failed to fetch feed ${source.sourceId}:`, err);
      feedErrors.push({
        sourceId: source.sourceId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  for (const source of API_SOURCES) {
    try {
      const result = await ingestOpenOttawa(
        source.endpoint,
        source.sourceId,
        source.mapFn,
        source.extractItems
      );
      feedsProcessed++;
      itemsIngested += result.inserted;
    } catch (err) {
      console.error(`[ingest-notes] Failed to fetch API source ${source.sourceId}:`, err);
      feedErrors.push({
        sourceId: source.sourceId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Step 2: Fetch all unprocessed raw_intel rows
  const unprocessed = await prisma.rawIntel.findMany({
    where: { processed: false },
  });

  // Step 3: Summarize each and persist
  let itemsSummarized = 0;
  for (const item of unprocessed) {
    try {
      const result = await summarizeNewsItem(item.body, item.sourceUrl);

      const noteSlug = await generateNoteSlug(result.headline);
      await prisma.processedNote.create({
        data: {
          rawIntelId: item.id,
          sourceUrl: item.sourceUrl,
          headline: result.headline,
          summary: result.summary,
          streetOrArea: result.street_or_area,
          category: result.category,
          impactSafety: result.impact.safety,
          impactCost: result.impact.cost,
          impactTime: result.impact.time,
          riskScore: result.risk_score,
          autoPublishEligible: result.auto_publish_eligible,
          slug: noteSlug,
          status: "DRAFT",
        },
      });

      await prisma.rawIntel.update({
        where: { id: item.id },
        data: { processed: true },
      });

      itemsSummarized++;
    } catch (err) {
      console.error(
        `[ingest-notes] Failed to summarize ${item.sourceUrl}:`,
        err
      );
      // Soft-fail: mark processed to prevent this item blocking the queue on retries
      await prisma.rawIntel.update({
        where: { id: item.id },
        data: { processed: true },
      });
    }
  }

  return NextResponse.json({ feedsProcessed, itemsIngested, itemsSummarized, feedErrors });
}
