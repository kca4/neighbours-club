import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getWalletBalance } from "@/lib/cp/wallet-view";
import CheckoutPage from "./CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout — Delivery",
};

export default async function Page() {
  const session = await auth();
  const walletBalance = session?.user?.id
    ? await getWalletBalance(session.user.id)
    : 0;

  return <CheckoutPage initialWalletBalance={walletBalance} />;
}
