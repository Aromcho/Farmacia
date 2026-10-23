import type { Gender, PaymentMethod, DeliveryMethod, OrderStatus } from './types';

/** $150.432 (pesos argentinos, sin decimales) */
export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return '$' + Math.round(n).toLocaleString('es-AR');
}

/** Porcentaje de ahorro entre precio de lista y precio en efectivo */
export function savingPct(price?: number | null, cash?: number | null): number {
  if (!price || !cash || cash >= price) return 0;
  return Math.round(((price - cash) / price) * 100);
}

export function installment(price: number | null | undefined, n = 3): string {
  if (!price) return '';
  return money(Math.ceil(price / n));
}

export const GENDER_LABEL: Record<Gender, string> = {
  FEMENINO: 'Para ella',
  MASCULINO: 'Para él',
  UNISEX: 'Unisex',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta (3 cuotas sin interés)',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
};

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  PICKUP: 'Retiro en la farmacia',
  DELIVERY: 'Envío a domicilio',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

/** Link de WhatsApp con mensaje opcional */
export function waLink(phone: string | null | undefined, text?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Teléfono para mostrar: 2255 41-8960 */
export function prettyPhone(phone: string | null | undefined): string {
  const d = (phone ?? '').replace(/\D/g, '');
  const local = d.replace(/^549?/, '').replace(/^0/, '');
  if (local.length === 10) return `${local.slice(0, 4)} ${local.slice(4, 6)}-${local.slice(6)}`;
  return phone ?? '';
}

export function hhmm(s: string | null | undefined): string {
  return (s ?? '').slice(0, 5);
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', ...opts }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  return formatDate(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** "hace 5 min", "hace 2 h", "hace 3 días" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'recién';
  if (diff < 3600) return `hace ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.round(diff / 3600)} h`;
  const days = Math.round(diff / 86400);
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  return formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('es-AR')} ${n === 1 ? one : many}`;
}

/** Quita acentos y pasa a minúsculas: para búsquedas locales */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Agrupa días consecutivos con el mismo horario: "Lunes a viernes · 08:30 a 13:00 y 16:30 a 21:00" */
export function groupWeek(week: { weekday: number; label: string; ranges: { opens: string; closes: string }[] }[]) {
  const key = (d: (typeof week)[number]) => d.ranges.map((r) => `${r.opens}-${r.closes}`).join(',');
  const groups: { from: string; to: string; weekdays: number[]; text: string }[] = [];
  for (const d of week) {
    const text = d.ranges.length ? d.ranges.map((r) => `${r.opens} a ${r.closes}`).join(' y ') : 'Cerrado';
    const last = groups[groups.length - 1];
    if (last && key(week.find((w) => w.weekday === last.weekdays[last.weekdays.length - 1])!) === key(d)) {
      last.to = d.label;
      last.weekdays.push(d.weekday);
    } else groups.push({ from: d.label, to: d.label, weekdays: [d.weekday], text });
  }
  return groups.map((g) => ({
    label: g.from === g.to ? g.from : g.weekdays.length === 2 ? `${g.from} y ${g.to.toLowerCase()}` : `${g.from} a ${g.to.toLowerCase()}`,
    weekdays: g.weekdays,
    text: g.text,
  }));
}

/** Teléfono argentino escrito a mano → número internacional para wa.me */
export function toWhatsApp(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('54')) return d.startsWith('549') ? d : `549${d.slice(2)}`;
  if (d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `549${d}` : d;
}
