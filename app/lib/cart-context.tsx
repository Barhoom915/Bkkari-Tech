"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { AuthChangeEvent, Session, UserResponse } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase-browser";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  details?: string;
  options?: string[];
  note?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  updateItem: (id: string, patch: Partial<CartItem>) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);
const GUEST_KEY = "bkkari_cart_guest_v2";
const ACCOUNT_PREFIX = "bkkari_cart_account_v2_";

function keyForUser(userId: string | null) {
  return userId ? `${ACCOUNT_PREFIX}${userId}` : GUEST_KEY;
}

function readCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  // Every account gets a different browser-storage namespace. Switching accounts
  // immediately switches the visible cart, so one user's cart cannot appear in another's.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const switchCart = (userId: string | null) => {
      if (!active) return;
      const nextKey = keyForUser(userId);
      setStorageKey(nextKey);
      setItems(readCart(nextKey));
    };

    supabase.auth.getUser().then((result: UserResponse) => switchCart(result.data.user?.id ?? null));

    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      switchCart(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Ignore storage quota/private-mode errors.
    }
  }, [items, storageKey]);

  function addItem(item: Omit<CartItem, "qty">, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, qty }];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<CartItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  function clear() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, updateItem, clear, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
