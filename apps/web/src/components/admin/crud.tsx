'use client';

import { Reorder } from 'motion/react';
import { GripVertical, Plus } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Img } from '@/components/ui/img';
import { useAdminMutation, useAdminQuery, type PublicTag } from '@/lib/admin';
import type { Media } from '@/lib/types';
import { SingleImageField } from './media';
import { Badge, DeleteButton, EditorDrawer, EmptyState, Field, Input, LoadingBlock, PageHeader, Select, Switch, Textarea } from './ui';

export type FieldSpec =
  | { key: string; label: string; type: 'text' | 'textarea' | 'color' | 'datetime'; hint?: string; required?: boolean }
  | { key: string; label: string; type: 'switch'; hint?: string }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'image'; mediaKey: string };

type Row = Record<string, unknown> & { id: string };

interface Props {
  title: string;
  text?: string;
  queryKey: string;
  listPath: string;
  basePath: string;
  fields: FieldSpec[];
  rowTitle: (r: Row) => string;
  rowSubtitle?: (r: Row) => ReactNode;
  rowImage?: (r: Row) => Media | null | undefined;
  rowBadges?: (r: Row) => ReactNode;
  reorderPath?: string;
  publicTags: PublicTag[];
  newLabel?: string;
  defaults?: Record<string, unknown>;
  canCreate?: boolean;
  canDelete?: boolean;
}

/** Listado + editor genérico para entidades simples del panel */
export function CrudPage(p: Props) {
  const list = useAdminQuery<Row[]>([p.queryKey], p.listPath);
  const [items, setItems] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  useEffect(() => setItems(list.data ?? []), [list.data]);

  const reorder = useAdminMutation<string[]>({ method: 'POST', path: p.reorderPath ?? '', body: (ids) => ({ ids }), invalidate: [[p.queryKey]], publicTags: p.publicTags, success: 'Orden guardado' });

  return (
    <>
      <PageHeader
        title={p.title}
        text={p.text}
        actions={
          p.canCreate !== false && (
            <button type="button" onClick={() => setEditing('new')} className="inline-flex h-11 items-center gap-2 rounded-full bg-teal-strong px-5 font-semibold text-white">
              <Plus className="size-4" /> {p.newLabel ?? 'Agregar'}
            </button>
          )
        }
      />
      {list.isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="Todavía no hay nada cargado" />
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          {items.map((r) => (
            <Reorder.Item
              key={r.id}
              value={r}
              dragListener={!!p.reorderPath}
              onDragEnd={() => p.reorderPath && reorder.mutate(items.map((i) => i.id))}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line"
            >
              {p.reorderPath && <GripVertical className="size-4 shrink-0 cursor-grab text-ink-soft" />}
              {p.rowImage && <Img media={p.rowImage(r)} ratio="1/1" sizes="56px" className="w-14 shrink-0 rounded-xl" />}
              <button type="button" onClick={() => setEditing(r)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-semibold text-ink">{p.rowTitle(r)}</span>
                {p.rowSubtitle && <span className="block truncate text-sm text-ink-soft">{p.rowSubtitle(r)}</span>}
              </button>
              {p.rowBadges && <span className="hidden shrink-0 gap-1.5 sm:flex">{p.rowBadges(r)}</span>}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
      {editing && <Editor key={editing === 'new' ? 'new' : editing.id} {...p} row={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Editor(p: Props & { row: Row | null; onClose: () => void }) {
  const init = () => {
    const v: Record<string, unknown> = { ...(p.defaults ?? {}) };
    for (const f of p.fields) {
      if (f.type === 'image') v[f.mediaKey] = p.row?.[f.mediaKey] ?? null;
      else if (p.row && f.key in p.row) v[f.key] = f.type === 'datetime' && p.row[f.key] ? String(p.row[f.key]).slice(0, 16) : p.row[f.key];
    }
    return v;
  };
  const [v, setV] = useState<Record<string, unknown>>(init);
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));

  const payload = () => {
    const out: Record<string, unknown> = {};
    for (const f of p.fields) {
      if (f.type === 'image') out[f.key] = (v[f.mediaKey] as Media | null)?.id ?? null;
      else if (f.type === 'datetime') out[f.key] = v[f.key] ? new Date(String(v[f.key])).toISOString() : null;
      else if (f.type === 'text' || f.type === 'textarea' || f.type === 'color') out[f.key] = (v[f.key] as string)?.trim() || (f.type === 'text' && 'required' in f && f.required ? '' : null);
      else out[f.key] = v[f.key];
    }
    return out;
  };

  const save = useAdminMutation<Record<string, unknown>>({
    method: p.row ? 'PATCH' : 'POST',
    path: p.row ? `${p.basePath}/${p.row.id}` : p.basePath,
    invalidate: [[p.queryKey]],
    publicTags: p.publicTags,
    success: p.row ? 'Cambios guardados' : 'Creado',
    onSuccess: p.onClose,
  });
  const remove = useAdminMutation({ method: 'DELETE', path: `${p.basePath}/${p.row?.id}`, invalidate: [[p.queryKey]], publicTags: p.publicTags, success: 'Eliminado', onSuccess: p.onClose });

  return (
    <EditorDrawer
      open
      onClose={p.onClose}
      title={p.row ? p.rowTitle(p.row) : (p.newLabel ?? 'Nuevo')}
      footer={
        <div className="flex items-center justify-between gap-3">
          {p.row && p.canDelete !== false ? <DeleteButton onConfirm={() => remove.mutate(undefined)} pending={remove.isPending} /> : <span />}
          <button type="button" onClick={() => save.mutate(payload())} disabled={save.isPending} className="h-11 rounded-full bg-teal-strong px-6 font-semibold text-white disabled:opacity-60">
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {p.fields.map((f) => {
          if (f.type === 'switch') return <Switch key={f.key} label={f.label} hint={f.hint} checked={!!(v[f.key] ?? true)} onChange={(c) => set(f.key, c)} />;
          if (f.type === 'image') return <SingleImageField key={f.key} label={f.label} value={(v[f.mediaKey] as Media) ?? null} onChange={(m) => set(f.mediaKey, m)} />;
          if (f.type === 'select')
            return (
              <Field key={f.key} label={f.label}>
                <Select value={String(v[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          if (f.type === 'textarea')
            return (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <Textarea rows={4} value={String(v[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
              </Field>
            );
          return (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <Input type={f.type === 'color' ? 'color' : f.type === 'datetime' ? 'datetime-local' : 'text'} value={String(v[f.key] ?? (f.type === 'color' ? '#009cac' : ''))} onChange={(e) => set(f.key, e.target.value)} className={f.type === 'color' ? 'w-24 p-1' : undefined} />
            </Field>
          );
        })}
      </div>
    </EditorDrawer>
  );
}

export const activeBadge = (r: Record<string, unknown>) => (r.active === false ? <Badge tone="red">Oculto</Badge> : null);
