import { NextRequest, NextResponse } from "next/server";

// TODO: wire to real CMS (Contentful, Sanity, or in-DB editorial content)
// Issue structure mirrors the editorial spec layout exactly.

export interface IssueStory {
  n: string;
  title: string;
  body: string[];
  quote?: { text: string; attribution: string };
  card?: {
    initial: string;
    name: string;
    sub: string;
    ctaLabel: string;
    ctaHref: string;
  };
  bullets?: { n: string; text: string }[];
  dropCap?: boolean;
}

export interface NoteIssue {
  id: string;
  number: number;
  headline: string;
  subhead: string;
  publishedAt: string;
  readMinutes: number;
  neighbourhood: string;
  byline: string;
  toc: { n: string; title: string }[];
  stories: IssueStory[];
  mentionedPartners: string;
  pastIssues: { n: string; title: string; date: string; slug: string }[];
}

const ISSUES: Record<string, NoteIssue> = {
  "issue-18": {
    id: "issue-18",
    number: 18,
    headline:
      "Three new patios, one farewell, and the return of butter chicken poutine.",
    subhead:
      "A roundup of what opened, what's leaving, and what's cooking on Hazeldean this week.",
    publishedAt: "Mon May 4",
    readMinutes: 4,
    neighbourhood: "Kanata",
    byline: "The Driver-in-Chief",
    toc: [
      { n: "01", title: "Patio season is open" },
      { n: "02", title: "Saying goodbye to Café Mio" },
      { n: "03", title: "Butter chicken poutine, again" },
      { n: "04", title: "Three things on Hazeldean" },
    ],
    stories: [
      {
        n: "01",
        title: "Patio season is officially open",
        dropCap: true,
        body: [
          "The first warm Saturday of the year did what it always does in Kanata — it sent everyone outside at once. Three patios on Hazeldean opened this weekend, and by 6 PM none of them had a free table. If you missed the rush, this week is your chance.",
          "The Grand Pizzeria stretched theirs all the way to the curb. Local Public Eatery added heaters, which feels optimistic for May but smart for May evenings. And around the corner, the new place that took over the old yoga studio finally soft-opened.",
        ],
        card: {
          initial: "G",
          name: "The Grand Pizzeria",
          sub: "Wood-fired · Hazeldean",
          ctaLabel: "Mentioned in this story",
          ctaHref: "/menu/grand-pizzeria",
        },
      },
      {
        n: "02",
        title: "Saying goodbye to Café Mio",
        body: [
          "After eleven years on Castlefrank, Café Mio is closing at the end of the month. Co-owner Daniela posted a handwritten note on the door — the kind of note you photograph and send to a friend.",
          "The last day is May 31. If you've never been, go. If you've been a hundred times, go anyway.",
        ],
        quote: {
          text: "Eleven years of espresso, eleven years of conversations. We're tired in the best way.",
          attribution: "From the note on the door",
        },
      },
      {
        n: "03",
        title: "Butter chicken poutine, again",
        body: [
          "Two years ago, Kanata had a brief, intense love affair with butter chicken poutine. Then it disappeared. This week, it's back — quietly added to the menu at one of our partners, without fanfare, on a Wednesday.",
          "We tested it. It is exactly as good as you remember.",
        ],
        card: {
          initial: "S",
          name: "Saffron Indian Kitchen",
          sub: "Indian · Centrum",
          ctaLabel: "Order it now",
          ctaHref: "/menu/saffron-indian-kitchen",
        },
      },
      {
        n: "04",
        title: "Three things on Hazeldean",
        bullets: [
          {
            n: "i.",
            text: "The bakery on the corner of Hazeldean and Castlefrank now opens at 6 AM. Confirmed by your neighbourhood driver at 6:04 AM, with photo evidence.",
          },
          {
            n: "ii.",
            text: "Glen Cairn farmers' market starts Sunday May 11. First-week vendors include three new ones we haven't seen before.",
          },
          {
            n: "iii.",
            text: "Construction on Eagleson is closing one lane until Friday. If you order delivery between 5 and 7 PM, please be patient with your driver.",
          },
        ],
        body: [],
      },
    ],
    mentionedPartners: "Saffron, Grand & 2 more",
    pastIssues: [
      {
        n: "17",
        title: "Why Tuesday is the best night to order in",
        date: "Apr 27",
        slug: "issue-17",
      },
      {
        n: "16",
        title: "A new bakery, a goodbye to the old one",
        date: "Apr 20",
        slug: "issue-16",
      },
      {
        n: "15",
        title: "Spring menus, ranked by your neighbours",
        date: "Apr 13",
        slug: "issue-15",
      },
    ],
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;
  const issue = ISSUES[issueId];
  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ issue });
}
