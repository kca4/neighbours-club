import type { Metadata } from "next";
import CheckoutPage from "./CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout — Delivery",
};

export default function Page() {
  return <CheckoutPage />;
}
