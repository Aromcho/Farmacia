'use client';

import { useMemo, useState } from 'react';
import { formatDate } from '@/lib/format';

/** Pedidos por día (últimos 30 días): una serie, barras finas, tooltip al pasar */
export function OrdersChart({ daily }: { daily: { day: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const map = new Map(daily.map((d) => [d.day, d.count]));
    const out: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(d);
      out.push({ day: key, count: map.get(key) ?? 0 });
    }
    return out;
  }, [daily]);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((a, d) => a + d.count, 0);
  const W = 600, H = 140, gap = 2, bw = W / days.length - gap;
  const h = hover !== null ? days[hover] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink-soft">Pedidos por día · últimos 30 días</p>
        <p className="tabular text-sm font-semibold text-ink">{h ? `${formatDate(`${h.day}T12:00:00`)}: ${h.count}` : `${total} en total`}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-3 w-full" role="img" aria-label={`Pedidos por día, ${total} en los últimos 30 días`} onMouseLeave={() => setHover(null)}>
        <line x1="0" x2={W} y1={H} y2={H} stroke="#d6ecec" />
        {days.map((d, i) => {
          const bh = d.count ? Math.max(4, (d.count / max) * (H - 8)) : 0;
          const x = i * (W / days.length) + gap / 2;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              <rect x={x - gap / 2} y={0} width={W / days.length} height={H} fill="transparent" />
              {bh > 0 && <path d={`M${x},${H} v${-(bh - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${bh - 4} z`} fill={hover === i ? '#005f69' : '#007783'} />}
            </g>
          );
        })}
        <text x="0" y={H + 15} fontSize="11" fill="#3d6468">{formatDate(`${days[0].day}T12:00:00`)}</text>
        <text x={W} y={H + 15} fontSize="11" fill="#3d6468" textAnchor="end">Hoy</text>
      </svg>
    </div>
  );
}
