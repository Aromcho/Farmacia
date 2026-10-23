import { Banknote, CreditCard, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import type { StoreInfo } from '@/lib/types';

const ICONS: Record<string, LucideIcon> = { 'credit-card': CreditCard, banknote: Banknote, truck: Truck, 'shield-check': ShieldCheck };

const DEFAULTS = [
  { icon: 'credit-card', title: '3 cuotas sin interés', text: 'Con tarjeta, en perfumería y regalería.' },
  { icon: 'banknote', title: 'Descuento en efectivo', text: 'Precio especial abonando en efectivo.' },
  { icon: 'truck', title: 'Envío a domicilio sin cargo', text: 'Pedís por WhatsApp y te lo llevamos.' },
  { icon: 'shield-check', title: 'Obras sociales y prepagas', text: 'Si no encontrás la tuya, escribinos.' },
];

/** Beneficios de la farmacia: lo primero que preguntan por WhatsApp */
export function Benefits({ info }: { info: StoreInfo | null }) {
  const items = info?.benefits?.length ? info.benefits : DEFAULTS;
  return (
    <section aria-label="Beneficios" className="border-b border-line bg-white">
      <ul className="container-x scroll-x gap-3 py-5 md:grid md:grid-cols-4 md:gap-0 md:divide-x md:divide-line md:py-7">
        {items.map((b) => {
          const Icon = ICONS[b.icon ?? ''] ?? ShieldCheck;
          return (
            <li key={b.title} className="flex w-[78vw] max-w-xs shrink-0 items-center gap-3.5 rounded-2xl bg-mist p-3.5 md:w-auto md:max-w-none md:rounded-none md:bg-transparent md:px-6 md:py-1 first:md:pl-0">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-foam text-teal-strong">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[0.95rem] font-semibold leading-tight text-ink">{b.title}</span>
                <span className="mt-0.5 block text-[0.84rem] leading-snug text-ink-soft">{b.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
