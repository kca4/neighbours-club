import { redirect } from "next/navigation";

/**
 * Canonical route for the kitchen dashboard is /partner/kitchen.
 * This page provides a stable /kitchen alias.
 */
export default function KitchenAlias() {
  redirect("/partner/kitchen");
}
