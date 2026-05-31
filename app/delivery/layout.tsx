import { CartProvider } from "./CartProvider";
import FloatingCartBar from "./FloatingCartBar";
import CartDrawer from "./[slug]/CartDrawer";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <FloatingCartBar />
      <CartDrawer />
    </CartProvider>
  );
}
