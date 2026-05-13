import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestRSSFeed } from "@/lib/notes-ingest";
import { summarizeNewsItem } from "@/lib/notes-intelligence";

const SOURCES = [
  {
    feedUrl: "https://www.cbc.ca/cmlink/rss-canada-ottawa",
    sourceId: "cbc-ottawa",
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
  for (const source of SOURCES) {
    const result = await ingestRSSFeed(source.feedUrl, source.sourceId);
    feedsProcessed++;
    itemsIngested += result.inserted;
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

      await prisma.processedNote.create({
        data: {
          rawIntelId: item.id,
          headline: result.headline,
          summary: result.summary,
          streetOrArea: result.street_or_area,
          category: result.category,
          impactSafety: result.impact.safety,
          impactCost: result.impact.cost,
          impactTime: result.impact.time,
          riskScore: result.risk_score,
          autoPublishEligible: result.auto_publish_eligible,
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

  return NextResponse.json({ feedsProcessed, itemsIngested, itemsSummarized });
}
