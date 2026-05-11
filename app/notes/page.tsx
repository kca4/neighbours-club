import type { Metadata } from "next";
import NotesFeed from "./NotesFeed";

export const metadata: Metadata = {
  title: "Neighbours Notes",
  description: "What's happening on your block — local news, partner spotlights, and community updates for Kanata.",
};

export default function NotesPage() {
  // TODO: replace static data below with real CMS / database queries

  const events = [
    { day: "Wed", date: "07", title: "Spring Makers Market", where: "Centrum Plaza · 4–8 PM", tag: "Free" },
    { day: "Sat", date: "10", title: "Hazeldean Library: Storytime", where: "Hazeldean Branch · 10:30 AM", tag: "Family" },
    { day: "Sun", date: "11", title: "Kanata Farmers' Market opens", where: "Glen Cairn · 9 AM", tag: "Local" },
  ];

  const civicAlerts = [
    { label: "Green bin pickup tomorrow", type: "waste" },
    { label: "Eagleson Rd lane closure until Fri", type: "construction" },
    { label: "Route 61 detour at Hazeldean", type: "transit" },
    { label: "Boil water advisory lifted", type: "alert" },
  ];

  const headsUp = [
    { icon: "trash", label: "Green bin", detail: "Tomorrow · Tue May 5", meta: "Curb by 7 AM" },
    { icon: "construction", label: "Eagleson Rd", detail: "Lane closure · Hazeldean to Hope Side", meta: "Until Fri" },
    { icon: "bus", label: "Route 61", detail: "Detour around Hazeldean Rd", meta: "Live" },
  ];

  return (
    <NotesFeed
      events={events}
      civicAlerts={civicAlerts}
      headsUp={headsUp}
    />
  );
}
