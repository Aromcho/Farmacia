'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Media, Product } from '@/lib/types';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  presentation: string | null;
  price: number | null;
  cashPrice: number | null;
  showPrice: boolean;
  image: Media | null;
  quantity: number;
  /** "Decant" / variante elegida */
  option?: string | null;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number | null;
  cashTotal: number | null;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  bump: number;
  add: (p: Product, qty?: number, option?: string | null) => void;
  setQty: (productId: string, option: string | null | undefined, qty: number) => void;
  remove: (productId: string, option?: string | null) => void;
  clear: () => void;
}

const KEY = 'af_pedido_v1';
const Ctx = createContext<CartCtx | null>(null);

const same = (a: CartItem, id: string, option?: string | null) => a.productId === id && (a.option ?? null) === (option ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const first = useRef(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* almacenamiento no disponible */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [items]);

  const add = useCallback((p: Product, qty = 1, option: string | null = null) => {
    setItems((prev) => {
      const i = prev.findIndex((it) => same(it, p.id, option));
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: Math.min(50, next[i].quantity + qty) };
        return next;
      }
      return [
        ...prev,
        {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand?.name ?? null,
          presentation: p.presentation,
          price: p.showPrice ? p.price : null,
          cashPrice: p.showPrice ? p.cashPrice : null,
          showPrice: p.showPrice,
          image: p.images[0]?.media ?? null,
          quantity: qty,
          option,
        },
      ];
    });
    setBump((b) => b + 1);
    toast.success('Agregado a tu pedido', {
      description: [p.brand?.name, p.name, option].filter(Boolean).join(' · '),
      action: { label: 'Ver pedido', onClick: () => router.push('/pedido') },
    });
  }, [router]);

  const setQty = useCallback((productId: string, option: string | null | undefined, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((it) => !same(it, productId, option)) : prev.map((it) => (same(it, productId, option) ? { ...it, quantity: Math.min(50, qty) } : it)),
    );
  }, []);

  const remove = useCallback((productId: string, option?: string | null) => {
    setItems((prev) => prev.filter((it) => !same(it, productId, option)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((a, it) => a + it.quantity, 0);
    const priced = items.length > 0 && items.every((it) => it.price !== null);
    const total = priced ? items.reduce((a, it) => a + (it.price ?? 0) * it.quantity, 0) : null;
    const cashPriced = items.length > 0 && items.every((it) => (it.cashPrice ?? it.price) !== null);
    const cashTotal = cashPriced ? items.reduce((a, it) => a + (it.cashPrice ?? it.price ?? 0) * it.quantity, 0) : null;
    return { items, count, total, cashTotal, ready, open, setOpen, bump, add, setQty, remove, clear };
  }, [items, ready, open, bump, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart fuera de CartProvider');
  return ctx;
}
