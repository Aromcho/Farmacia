'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, DeleteButton, Field, Input, LoadingBlock, PageHeader, SaveBar, SegmentedTabs, Switch } from '@/components/admin/ui';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { Season, SpecialDay } from '@/lib/types';

type Slot = { season: Season; weekday: number; opens: string; closes: string };
type SeasonCfg = { mode: 'AUTO' | 'REGULAR' | 'SUMMER'; summerStart: string; summerEnd: string };
const DAYS = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SEASON_LABEL: Record<Season, string> = { REGULAR: 'Resto del año', SUMMER: 'Verano' };
const sortSlots = (s: Slot[]) => [...s].sort((a, b) => a.season.localeCompare(b.season) || a.weekday - b.weekday || a.opens.localeCompare(b.opens));

export default function HoursAdminPage() {
  const hours = useAdminQuery<Slot[]>(['admin-hours'], '/admin/store/hours');
  const settings = useAdminQuery<Record<string, unknown>>(['admin-settings'], '/admin/store/settings');
  const special = useAdminQuery<SpecialDay[]>(['admin-special'], '/admin/store/special-days');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [season, setSeason] = useState<Season>('REGULAR');
  const [cfg, setCfg] = useState<SeasonCfg>({ mode: 'AUTO', summerStart: '12-15', summerEnd: '03-15' });
  const [newDay, setNewDay] = useState({ date: '', label: '', closed: true, opens: '09:00', closes: '13:00' });

  useEffect(() => {
    if (hours.data) setSlots(sortSlots(hours.data.map(({ season, weekday, opens, closes }) => ({ season, weekday, opens, closes }))));
  }, [hours.data]);
  useEffect(() => {
    if (settings.data?.season) setCfg(settings.data.season as SeasonCfg);
  }, [settings.data]);

  const original = useMemo(() => JSON.stringify(sortSlots((hours.data ?? []).map(({ season, weekday, opens, closes }) => ({ season, weekday, opens, closes })))), [hours.data]);
  const dirty = JSON.stringify(sortSlots(slots)) !== original;
  const invalid = slots.some((s) => !/^\d{2}:\d{2}$/.test(s.opens) || !/^\d{2}:\d{2}$/.test(s.closes) || s.opens >= s.closes);

  const saveHours = useAdminMutation({ method: 'PUT', path: '/admin/store/hours', body: () => ({ slots: sortSlots(slots) }), invalidate: [['admin-hours'], ['stats']], publicTags: ['store'], success: 'Horarios guardados' });
  const saveCfg = useAdminMutation<SeasonCfg>({ method: 'PUT', path: '/admin/store/season', invalidate: [['admin-settings'], ['stats']], publicTags: ['store'], success: 'Temporada actualizada' });
  const addSpecial = useAdminMutation({
    method: 'POST', path: '/admin/store/special-days',
    body: () => ({ date: newDay.date, label: newDay.label.trim(), closed: newDay.closed, ...(newDay.closed ? {} : { opens: newDay.opens, closes: newDay.closes }) }),
    invalidate: [['admin-special']], publicTags: ['store'], success: 'Día especial agregado',
    onSuccess: () => setNewDay({ date: '', label: '', closed: true, opens: '09:00', closes: '13:00' }),
  });
  const delSpecial = useAdminMutation<string>({ method: 'DELETE', path: (id) => `/admin/store/special-days/${id}`, invalidate: [['admin-special']], publicTags: ['store'], success: 'Eliminado' });

  if (hours.isLoading || settings.isLoading) return <LoadingBlock />;
  const seasonSlots = slots.filter((s) => s.season === season);

  return (
    <>
      <PageHeader title="Horarios" text="Con estos horarios la web muestra “Abierto ahora” y la cruz se enciende o se apaga sola." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Horario semanal" actions={<SegmentedTabs value={season} onChange={setSeason} options={[{ value: 'REGULAR', label: SEASON_LABEL.REGULAR }, { value: 'SUMMER', label: SEASON_LABEL.SUMMER }]} />}>
          <ul className="divide-y divide-line">
            {DAYS.map((wd) => {
              const day = seasonSlots.filter((s) => s.weekday === wd);
              return (
                <li key={wd} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                  <span className="w-28 shrink-0 pt-2.5 font-semibold text-ink">{DAY_LABEL[wd]}</span>
                  <div className="flex-1 space-y-2">
                    {day.length === 0 && <p className="pt-2.5 text-sm text-ink-soft">Cerrado</p>}
                    {day.map((s) => {
                      const idx = slots.indexOf(s);
                      const bad = s.opens >= s.closes;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <Input type="time" value={s.opens} onChange={(e) => setSlots(slots.map((x, i) => (i === idx ? { ...x, opens: e.target.value } : x)))} className={cn('w-32', bad && 'ring-[#b42318]')} />
                          <span className="text-ink-soft">a</span>
                          <Input type="time" value={s.closes} onChange={(e) => setSlots(slots.map((x, i) => (i === idx ? { ...x, closes: e.target.value } : x)))} className={cn('w-32', bad && 'ring-[#b42318]')} />
                          <button type="button" onClick={() => setSlots(slots.filter((_, i) => i !== idx))} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-mist" aria-label="Quitar franja">
                            <X className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setSlots([...slots, { season, weekday: wd, opens: day.length ? '16:30' : '08:30', closes: day.length ? '21:00' : '13:00' }])} className="inline-flex h-9 items-center gap-1 self-start rounded-full px-3 text-sm font-semibold text-teal-strong hover:bg-foam">
                    <Plus className="size-4" /> Franja
                  </button>
                </li>
              );
            })}
          </ul>
          {invalid && <p className="mt-3 text-sm font-medium text-[#b42318]">Revisá las franjas marcadas: la hora de apertura tiene que ser anterior al cierre.</p>}
        </Card>

        <div className="space-y-6">
          <Card title="Temporada">
            <div className="space-y-4">
              <SegmentedTabs
                value={cfg.mode}
                onChange={(mode) => setCfg({ ...cfg, mode })}
                options={[
                  { value: 'AUTO', label: 'Automática' },
                  { value: 'REGULAR', label: 'Resto del año' },
                  { value: 'SUMMER', label: 'Verano' },
                ]}
              />
              {cfg.mode === 'AUTO' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Verano desde" hint="Formato MM-DD">
                    <Input value={cfg.summerStart} onChange={(e) => setCfg({ ...cfg, summerStart: e.target.value })} placeholder="12-15" />
                  </Field>
                  <Field label="Hasta" hint="Formato MM-DD">
                    <Input value={cfg.summerEnd} onChange={(e) => setCfg({ ...cfg, summerEnd: e.target.value })} placeholder="03-15" />
                  </Field>
                </div>
              )}
              <button type="button" onClick={() => saveCfg.mutate(cfg)} className="h-10 w-full rounded-full bg-ink text-sm font-semibold text-white">
                Guardar temporada
              </button>
            </div>
          </Card>

          <Card title="Feriados y días especiales">
            <ul className="mb-4 space-y-2">
              {(special.data ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2">
                  <span className="text-sm">
                    <span className="font-semibold text-ink">{formatDate(`${d.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="text-ink-soft"> · {d.label} · {d.closed ? 'cerrado' : `${d.opens} a ${d.closes}`}</span>
                  </span>
                  <DeleteButton compact onConfirm={() => delSpecial.mutate(d.id)} />
                </li>
              ))}
              {special.data?.length === 0 && <li className="text-sm text-ink-soft">No hay días especiales cargados.</li>}
            </ul>
            <div className="space-y-3 rounded-2xl ring-1 ring-line p-3">
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={newDay.date} onChange={(e) => setNewDay({ ...newDay, date: e.target.value })} />
                <Input value={newDay.label} onChange={(e) => setNewDay({ ...newDay, label: e.target.value })} placeholder="Ej.: Navidad" />
              </div>
              <Switch label="Cerrado todo el día" checked={newDay.closed} onChange={(closed) => setNewDay({ ...newDay, closed })} />
              {!newDay.closed && (
                <div className="flex items-center gap-2">
                  <Input type="time" value={newDay.opens} onChange={(e) => setNewDay({ ...newDay, opens: e.target.value })} />
                  <span className="text-ink-soft">a</span>
                  <Input type="time" value={newDay.closes} onChange={(e) => setNewDay({ ...newDay, closes: e.target.value })} />
                </div>
              )}
              <button type="button" disabled={!newDay.date || !newDay.label.trim()} onClick={() => addSpecial.mutate(undefined)} className="h-10 w-full rounded-full bg-teal-strong text-sm font-semibold text-white disabled:opacity-50">
                Agregar día especial
              </button>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saveHours.isPending} onSave={() => !invalid && saveHours.mutate(undefined)} onReset={() => hours.data && setSlots(sortSlots(hours.data.map(({ season, weekday, opens, closes }) => ({ season, weekday, opens, closes }))))} label="Guardar horarios" />
    </>
  );
}
