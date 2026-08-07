"use client";

import { useEffect } from "react";
import { useCart } from "../CartProvider";

/**
 * Rendered by the [slug] server page when the restaurant is inactive (preview mode).
 * Signals CartProvider to disable checkout in CartDrawer and FloatingCartBar.
 * Returns null — no visible output.
 */
export default function PreviewModeSetter() {
  const { setPreviewMode } = useCart();
  useEffect(() => {
    setPreviewMode(true);
    return () => setPreviewMode(false);
  }, [setPreviewMode]);
  return null;
}
