"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

const CART_STORAGE_KEY = 'nc:cart';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  colorHex?: string | null;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantSlug: string | null;
  items: CartItem[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem; restaurant: RestaurantInfo }
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "CLEAR_CART" }
  | { type: "_REPLACE_CART"; item: CartItem; restaurant: RestaurantInfo }
  | { type: "_RESTORE_CART"; savedState: CartState };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const emptyState: CartState = {
  restaurantId: null,
  restaurantName: null,
  restaurantSlug: null,
  items: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.itemId === action.item.itemId);
      return {
        ...state,
        restaurantId: action.restaurant.id,
        restaurantName: action.restaurant.name,
        restaurantSlug: action.restaurant.slug,
        items: existing
          ? state.items.map((i) =>
              i.itemId === action.item.itemId
                ? { ...i, quantity: i.quantity + action.item.quantity }
                : i
            )
          : [...state.items, action.item],
      };
    }
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        const next = state.items.filter((i) => i.itemId !== action.itemId);
        return next.length === 0 ? emptyState : { ...state, items: next };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.itemId === action.itemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "REMOVE_ITEM": {
      const next = state.items.filter((i) => i.itemId !== action.itemId);
      return next.length === 0 ? emptyState : { ...state, items: next };
    }
    case "CLEAR_CART":
      return emptyState;
    case "_REPLACE_CART":
      return {
        restaurantId: action.restaurant.id,
        restaurantName: action.restaurant.name,
        restaurantSlug: action.restaurant.slug,
        items: [action.item],
      };
    case "_RESTORE_CART":
      return action.savedState;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  state: CartState;
  itemCount: number;
  subtotal: number;
  /** Returns true if item was added; false if a switch-restaurant dialog was shown instead. */
  addItem: (item: CartItem, restaurant: RestaurantInfo) => boolean;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// ─── Switch-restaurant confirmation dialog ─────────────────────────────────────

interface PendingSwitch {
  item: CartItem;
  restaurant: RestaurantInfo;
}

function SwitchRestaurantDialog({
  currentRestaurantName,
  onConfirm,
  onCancel,
}: {
  currentRestaurantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="switch-dialog-title"
          className="text-lg font-bold text-foreground"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Start a new order?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          Your current cart from{" "}
          <span className="font-semibold text-foreground">
            {currentRestaurantName}
          </span>{" "}
          will be cleared.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Keep current
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start new order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, emptyState);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // hydrated gates the persistence effect so the initial emptyState render
  // never overwrites a saved cart before the hydration effect has run.
  const [hydrated, setHydrated] = useState(false);

  // ① Hydrate from localStorage once on mount (client-only — effects never
  //    run during SSR, so localStorage is always available here).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as CartState;
        if (Array.isArray(saved.items)) {
          dispatch({ type: "_RESTORE_CART", savedState: saved });
        }
      }
    } catch {
      // Corrupt storage — start fresh; the next write will overwrite it.
    }
    setHydrated(true);
  }, []);

  // ② Persist on every state change, but only after hydration has completed.
  //    When the cart is empty (after checkout or explicit clear), remove the
  //    key entirely so a reload does not resurrect a stale cart.
  useEffect(() => {
    if (!hydrated) return;
    if (state.items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addItem = useCallback(
    (item: CartItem, restaurant: RestaurantInfo): boolean => {
      if (
        state.restaurantId &&
        state.restaurantId !== restaurant.id &&
        state.items.length > 0
      ) {
        setPendingSwitch({ item, restaurant });
        return false;
      }
      dispatch({ type: "ADD_ITEM", item, restaurant });
      return true;
    },
    [state.restaurantId, state.items.length]
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    dispatch({
      type: "_REPLACE_CART",
      item: pendingSwitch.item,
      restaurant: pendingSwitch.restaurant,
    });
    setPendingSwitch(null);
  }, [pendingSwitch]);

  const cancelSwitch = useCallback(() => setPendingSwitch(null), []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", itemId, quantity });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", itemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        state,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
      {pendingSwitch && (
        <SwitchRestaurantDialog
          currentRestaurantName={state.restaurantName ?? ""}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </CartContext.Provider>
  );
}
