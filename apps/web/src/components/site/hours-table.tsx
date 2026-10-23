'use client';

import { cn } from '@/lib/cn';
import { formatDate, groupWeek } from '@/lib/format';
import type { Season } from '@/lib/types';
import { statusText, useStore } from './store-provider';
import { LedDot } from './status-pill';

const SEASON_LABEL: Record<Season, string> = { SUMMER: 'Temporada de verano', REGULAR: 'Resto del año' };

export function HoursTable() {
  const { hours } = useStore();
  if (!hours) return null;
  const s = statusText(hours);
  const seasons: Season[] = hours.season === 'SUMMER' ? ['SUMMER', 'REGULAR'] : ['REGULAR', 'SUMMER'];
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full bg-mist px-3.5 py-2 text-sm font-semibold text-ink">
        <LedDot on={s.open} warn={s.soon} />
        <span className="tabular">{s.long}</span>
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {seasons.map((season) => {
          const current = season === hours.season;
          return (
            <div key={season} className={cn('rounded-[1.5rem] p-5', current ? 'bg-white shadow-float ring-1 ring-line' : 'bg-mist')}>
              <p className="flex items-center justify-between text-sm font-semibold">
                <span className={current ? 'text-teal-strong' : 'text-ink-soft'}>{SEASON_LABEL[season]}</span>
                {current && <span className="rounded-full bg-foam px-2.5 py-1 text-xs text-teal-strong">Vigente</span>}
              </p>
              <dl className="mt-3 space-y-3">
                {groupWeek(hours.weeks[season]).map((g) => (
                  <div key={g.label}>
                    <dt className="text-[0.82rem] text-ink-soft">
                      {g.label}
                      {current && g.weekdays.includes(hours.weekday) && <strong className="text-teal-strong"> · hoy</strong>}
                    </dt>
                    <dd className="tabular font-semibold text-ink">{g.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      {hours.upcomingSpecialDays.length > 0 && (
        <div className="mt-4 rounded-2xl bg-sun-soft p-4 text-sm text-ink">
          <p className="font-semibold">Días especiales</p>
          <ul className="mt-2 space-y-1">
            {hours.upcomingSpecialDays.map((d) => (
              <li key={d.id} className="tabular">
                {formatDate(`${d.date}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}: {d.label} — {d.closed ? 'cerrado' : `${d.opens} a ${d.closes}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
