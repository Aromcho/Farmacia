'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PublicStore, StoreHours, StoreInfo } from '@/lib/types';

interface StoreCtx {
  info: StoreInfo | null;
  hours: StoreHours | null;
  stats: PublicStore['stats'] | null;
}

const Ctx = createContext<StoreCtx>({ info: null, hours: null, stats: null });

/** Datos de la farmacia (contacto + estado abierto/cerrado), refrescados cada minuto */
export function StoreProvider({ initial, children }: { initial: PublicStore | null; children: ReactNode }) {
  const [hours, setHours] = useState<StoreHours | null>(initial?.hours ?? null);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const res = await fetch('/api/store/hours', { cache: 'no-store' });
        if (res.ok && alive) setHours(await res.json());
      } catch {
        /* sin conexión: se mantiene el último estado */
      }
    };
    const id = window.setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return <Ctx.Provider value={{ info: initial?.info ?? null, hours, stats: initial?.stats ?? null }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

/** Texto corto del estado: "Abierto · cierra 21:00" / "Cerrado · abre mañana 08:30" */
export function statusText(h: StoreHours | null): { open: boolean; short: string; long: string; soon: boolean } {
  if (!h) return { open: false, short: 'Horarios', long: 'Consultá nuestros horarios', soon: false };
  if (h.isOpen) {
    const until = h.closesAt ? `cierra ${h.closesAt}` : '';
    return {
      open: true,
      soon: h.closingSoon,
      short: h.closingSoon ? `Cierra pronto · ${h.closesAt}` : 'Abierto ahora',
      long: h.closingSoon ? `Cerramos a las ${h.closesAt}, ¡llegás!` : `Abierto ahora${until ? ` · ${until}` : ''}`,
    };
  }
  if (h.todaySpecial?.closed) {
    return { open: false, soon: false, short: 'Cerrado hoy', long: `Hoy cerrado: ${h.todaySpecial.label}` };
  }
  const next = h.next ? `${h.next.dayLabel === 'Hoy' ? 'abre' : `abre ${h.next.dayLabel.toLowerCase()}`} ${h.next.opens}` : '';
  return { open: false, soon: false, short: 'Cerrado ahora', long: `Cerrado ahora${next ? ` · ${next}` : ''}` };
}
