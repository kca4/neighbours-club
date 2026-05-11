import { NextRequest, NextResponse } from "next/server";

// TODO: wire to real ingestion sources:
//   - Partner spotlights: restaurant CMS / database
//   - Editorial: editorial CMS (e.g. Contentful / Sanity)
//   - BIA events: Kanata Central BIA event feed
//   - Civic alerts: City of Ottawa Open Data API, OC Transpo API

export type NotesFeedItemType =
  | "spotlight"
  | "editorial"
  | "event"
  | "civic_alert";

export interface NotesFeedItem {
  id: string;
  type: NotesFeedItemType;
  title: string;
  body?: string;
  tag?: string;
  date: string;
  neighbourhood: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** For events: structured date display */
  eventDay?: string;
  eventDate?: string;
  eventWhere?: string;
  /** For editorial: issue number and reading time */
  issueNumber?: number;
  readMinutes?: number;
  issueSlug?: string;
}

const MOCK_FEED: NotesFeedItem[] = [
  {
    id: "spotlight-maiko-001",
    type: "spotlight",
    title: "Maïko Ramen joins the Neighbours family",
    body:
      "Hidden behind Hazeldean Mall, Chef Yuki has been pulling 18-hour tonkotsu broth for six years. Now she's on Neighbours — and the first 50 orders ship with handwritten thank-you notes.",
    tag: "New Partner",
    date: "2026-05-04",
    neighbourhood: "Kanata",
    ctaLabel: "Order from Maïko →",
    ctaHref: "/menu/maiko-ramen",
  },
  {
    id: "editorial-18",
    type: "editorial",
    title:
      "Three new patios, one farewell, and the return of butter chicken poutine.",
    body:
      "A roundup of what opened, what's leaving, and what's cooking on Hazeldean this week — written by your neighbourhood driver-in-chief.",
    date: "2026-05-04",
    neighbourhood: "Kanata",
    issueNumber: 18,
    readMinutes: 4,
    issueSlug: "issue-18",
    ctaLabel: "Read the issue →",
    ctaHref: "/notes/issue-18",
  },
  {
    id: "event-makers-market-001",
    type: "event",
    title: "Spring Makers Market",
    tag: "Free",
    date: "2026-05-07",
    neighbourhood: "Kanata",
    eventDay: "Wed",
    eventDate: "07",
    eventWhere: "Centrum Plaza · 4–8 PM",
  },
  {
    id: "event-library-storytime-001",
    type: "event",
    title: "Hazeldean Library: Storytime",
    tag: "Family",
    date: "2026-05-10",
    neighbourhood: "Kanata",
    eventDay: "Sat",
    eventDate: "10",
    eventWhere: "Hazeldean Branch · 10:30 AM",
  },
  {
    id: "event-farmers-market-001",
    type: "event",
    title: "Kanata Farmers' Market opens",
    tag: "Local",
    date: "2026-05-11",
    neighbourhood: "Kanata",
    eventDay: "Sun",
    eventDate: "11",
    eventWhere: "Glen Cairn · 9 AM",
  },
  {
    id: "civic-green-bin-001",
    type: "civic_alert",
    title: "Green bin pickup tomorrow",
    tag: "Waste",
    date: "2026-05-04",
    neighbourhood: "Kanata",
  },
  {
    id: "civic-eagleson-closure-001",
    type: "civic_alert",
    title: "Eagleson Rd lane closure until Fri",
    tag: "Construction",
    date: "2026-05-04",
    neighbourhood: "Kanata",
  },
  {
    id: "civic-route61-001",
    type: "civic_alert",
    title: "Route 61 detour at Hazeldean",
    tag: "Transit",
    date: "2026-05-04",
    neighbourhood: "Kanata",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const neighbourhood = searchParams.get("neighbourhood") ?? "Kanata";
  const type = searchParams.get("type") as NotesFeedItemType | null;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const exclude = searchParams.get("exclude");

  let items = MOCK_FEED.filter(
    (item) =>
      item.neighbourhood.toLowerCase() === neighbourhood.toLowerCase() &&
      (type == null || item.type === type) &&
      (exclude == null || item.id !== exclude)
  );

  if (!isNaN(limit)) {
    items = items.slice(0, limit);
  }

  return NextResponse.json({ items });
}
