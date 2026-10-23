'use client';

import { AnimatePresence, motion, Reorder } from 'motion/react';
import { GripVertical, ImagePlus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MediaLibrary, SingleImageField, UploadDrop } from '@/components/admin/media';
import { Badge, DeleteButton, EditorDrawer, EmptyState, Field, Input, LoadingBlock, PageHeader, Select, Switch } from '@/components/admin/ui';
import { HighlightsRow } from '@/components/stories/highlights-row';
import { Img } from '@/components/ui/img';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import type { Highlight, Media, Paginated, Product } from '@/lib/types';

type ItemDraft = { key: string; media: Media; caption: string; productId: string; linkUrl: string; durationMs: number };

export default function HighlightsAdminPage() {
  const { data, isLoading } = useAdminQuery<Highlight[]>(['admin-highlights'], '/admin/highlights');
  const [list, setList] = useState<Highlight[]>([]);
  const [editing, setEditing] = useState<Highlight | 'new' | null>(null);
  useEffect(() => setList(data ?? []), [data]);
  const reorder = useAdminMutation<string[]>({ method: 'POST', path: '/admin/highlights/reorder', body: (ids) => ({ ids }), invalidate: [['admin-highlights']], publicTags: ['content'], success: 'Orden guardado' });

  return (
    <>
      <PageHeader
        title="Historias destacadas"
        text="Los círculos del inicio, como en Instagram. Cada historia puede llevar texto y un link a un producto."
        actions={
          <button type="button" onClick={() => setEditing('new')} className="inline-flex h-11 items-center gap-2 rounded-full bg-teal-strong px-5 font-semibold text-white">
            <Plus className="size-4" /> Nueva destacada
          </button>
        }
      />
      {data && data.length > 0 && (
        <div className="mb-6 rounded-[1.5rem] bg-night p-5">
          <p className="mb-3 text-xs font-semibold text-white/60">Vista previa (tocá un círculo para verla como en la web)</p>
          <HighlightsRow highlights={data.filter((h) => h.active)} />
        </div>
      )}
      {isLoading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState title="Sin historias destacadas" />
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={setList} className="space-y-2">
          {list.map((h) => (
            <Reorder.Item key={h.id} value={h} onDragEnd={() => reorder.mutate(list.map((x) => x.id))} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
              <GripVertical className="size-4 shrink-0 cursor-grab text-ink-soft" />
              <Img media={h.cover ?? h.items[0]?.media} ratio="1/1" sizes="56px" className="w-14 shrink-0 rounded-full" />
              <button type="button" onClick={() => setEditing(h)} className="min-w-0 flex-1 text-left">
                <span className="block font-semibold text-ink">{h.title}</span>
                <span className="block text-sm text-ink-soft">
                  {h.items.length} historias · {h.items.filter((i) => i.product).length} con producto
                </span>
              </button>
              {!h.active && <Badge tone="red">Oculta</Badge>}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
      {editing && <HighlightEditor key={editing === 'new' ? 'new' : editing.id} highlight={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function HighlightEditor({ highlight: h, onClose }: { highlight: Highlight | null; onClose: () => void }) {
  const [title, setTitle] = useState(h?.title ?? '');
  const [active, setActive] = useState(h?.active ?? true);
  const [cover, setCover] = useState<Media | null>(h?.cover ?? null);
  const [items, setItems] = useState<ItemDraft[]>(
    (h?.items ?? []).map((i) => ({ key: i.id, media: i.media, caption: i.caption ?? '', productId: i.productId ?? '', linkUrl: i.linkUrl ?? '', durationMs: i.durationMs })),
  );
  const [libOpen, setLibOpen] = useState(false);
  const products = useAdminQuery<Paginated<Product>>(['admin-products-all'], '/admin/products?pageSize=500&sort=name');

  const addMedia = (ms: Media[]) => setItems((s) => [...s, ...ms.map((m) => ({ key: `${m.id}-${Math.random()}`, media: m, caption: '', productId: '', linkUrl: '', durationMs: 5000 }))]);
  const upd = (key: string, patch: Partial<ItemDraft>) => setItems((s) => s.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const body = () => ({
    title: title.trim(),
    active,
    coverId: cover?.id ?? null,
    items: items.map((i) => ({ mediaId: i.media.id, caption: i.caption.trim() || null, productId: i.productId || null, linkUrl: i.linkUrl.trim() || null, durationMs: i.durationMs })),
  });
  const save = useAdminMutation({ method: h ? 'PATCH' : 'POST', path: h ? `/admin/highlights/${h.id}` : '/admin/highlights', body, invalidate: [['admin-highlights']], publicTags: ['content'], success: 'Guardado', onSuccess: onClose });
  const remove = useAdminMutation({ method: 'DELETE', path: `/admin/highlights/${h?.id}`, invalidate: [['admin-highlights']], publicTags: ['content'], success: 'Destacada eliminada', onSuccess: onClose });

  return (
    <EditorDrawer
      open
      onClose={onClose}
      title={h ? h.title : 'Nueva destacada'}
      footer={
        <div className="flex items-center justify-between">
          {h ? <DeleteButton onConfirm={() => remove.mutate(undefined)} pending={remove.isPending} /> : <span />}
          <button type="button" disabled={!title.trim() || save.isPending} onClick={() => save.mutate(undefined)} className="h-11 rounded-full bg-teal-strong px-6 font-semibold text-white disabled:opacity-50">
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Título">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="Ej.: Perfumes" />
        </Field>
        <SingleImageField label="Portada del círculo (opcional)" value={cover} onChange={setCover} />
        <Switch label="Visible en la web" checked={active} onChange={setActive} />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Historias ({items.length})</span>
            <button type="button" onClick={() => setLibOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-strong">
              <ImagePlus className="size-4" /> De la biblioteca
            </button>
          </div>
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <Reorder.Item key={it.key} value={it} className="flex gap-3 rounded-2xl bg-mist p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-20 shrink-0">
                    <Img media={it.media} ratio="9/16" sizes="80px" className="rounded-xl" />
                    <GripVertical className="mx-auto mt-1 size-4 cursor-grab text-ink-soft" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input value={it.caption} onChange={(e) => upd(it.key, { caption: e.target.value })} placeholder="Texto (opcional)" />
                    <Select value={it.productId} onChange={(e) => upd(it.key, { productId: e.target.value })}>
                      <option value="">Sin producto vinculado</option>
                      {products.data?.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {[p.brand?.name, p.name].filter(Boolean).join(' · ')}
                        </option>
                      ))}
                    </Select>
                    <div className="flex items-center gap-2">
                      <Input value={it.linkUrl} onChange={(e) => upd(it.key, { linkUrl: e.target.value })} placeholder="Link externo (opcional)" />
                      <Select value={String(it.durationMs)} onChange={(e) => upd(it.key, { durationMs: Number(e.target.value) })} className="w-24 shrink-0">
                        {[4000, 5000, 6000, 8000, 10000].map((d) => (
                          <option key={d} value={d}>{d / 1000} s</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <button type="button" onClick={() => setItems((s) => s.filter((x) => x.key !== it.key))} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white" aria-label="Quitar historia">
                    <X className="size-4" />
                  </button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
          <div className="mt-3">
            <UploadDrop onUploaded={addMedia} />
          </div>
        </div>
      </div>
      <EditorDrawer open={libOpen} onClose={() => setLibOpen(false)} title="Agregar desde la biblioteca">
        <MediaLibrary
          selected={[]}
          onToggle={(m) => {
            addMedia([m]);
          }}
        />
        <motion.p className="mt-4 text-center text-sm text-ink-soft">Cada imagen que tocás se agrega al final.</motion.p>
      </EditorDrawer>
    </EditorDrawer>
  );
}
