import type { Metadata } from "next";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Submit Your Business",
  description:
    "Share an announcement, offer, or community update with Kanata neighbours. Free to submit — reviewed before it appears in the feed.",
};

export default function SubmitBusinessPage() {
  return <SubmitForm />;
}
