'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WhatsAppIcon } from '@/components/ui/icons';
import { normalize, waLink } from '@/lib/format';
import type { Insurer } from '@/lib/types';
import { useStore } from './store-provider';

export function InsurersSearch({ insurers }: { insurers: Insurer[] }) {
  const [q, setQ] = useState('');
  const { info } = useStore();
  const list = useMemo(() => {
    const n = normalize(q);
    return n ? insurers.filter((x) => normalize(`${x.name} ${x.fullName ?? ''}`).includes(n)) : insurers;
  }, [q, insurers]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Buscar obra social</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-teal-strong" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribí tu obra social o prepaga"
          className="h-14 w-full rounded-full bg-white pl-12 pr-5 text-[1.05rem] text-ink shadow-float outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong"
        />
      </label>
      {list.length > 0 ? (
        <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x) => (
            <li key={x.id} className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line">
              <p className="font-semibold text-ink">{x.name}</p>
              {x.fullName && <p className="mt-0.5 text-sm leading-snug text-ink-soft">{x.fullName}</p>}
              {x.note && <p className="mt-1 text-sm text-teal-strong">{x.note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-[1.75rem] bg-foam p-8 text-center">
          <p className="font-serif text-2xl text-ink">No encontramos “{q}”</p>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">Puede que trabajemos con tu cobertura a través de otro convenio. Escribinos y te confirmamos.</p>
          {info && (
            <a href={waLink(info.whatsapp, `¡Hola! ¿Trabajan con la obra social ${q}?`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-teal-strong px-6 font-semibold text-white">
              <WhatsAppIcon className="size-5" /> Consultar por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
