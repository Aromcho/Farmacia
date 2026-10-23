'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import { Check, GripVertical, ImagePlus, Loader2, Search, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Img } from '@/components/ui/img';
import { get, uploadMedia } from '@/lib/client-api';
import { cn } from '@/lib/cn';
import type { Media, Paginated } from '@/lib/types';
import { EditorDrawer } from './ui';

/** Subida con arrastrar y soltar (muestra progreso por archivo) */
export function UploadDrop({ onUploaded, multiple = true, compact }: { onUploaded: (m: Media[]) => void; multiple?: boolean; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const qc = useQueryClient();

  const handle = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => /^(image|video)\//.test(f.type));
      if (!list.length) return;
      const done: Media[] = [];
      await Promise.all(
        list.map(async (f) => {
          try {
            const m = await uploadMedia(f, f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), (p) => setProgress((s) => ({ ...s, [f.name]: p })));
            done.push(m);
          } catch (e) {
            toast.error(`No se pudo subir ${f.name}`, { description: (e as Error).message });
          } finally {
            setProgress((s) => {
              const n = { ...s };
              delete n[f.name];
              return n;
            });
          }
        }),
      );
      if (done.length) {
        qc.invalidateQueries({ queryKey: ['media'] });
        toast.success(done.length === 1 ? 'Imagen subida' : `${done.length} archivos subidos`);
        onUploaded(done);
      }
    },
    [onUploaded, qc],
  );

  const uploading = Object.keys(progress).length > 0;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors',
        compact ? 'aspect-[4/5] p-3' : 'px-6 py-8',
        over ? 'border-teal-strong bg-foam' : 'border-line bg-mist hover:border-teal/50',
      )}
    >
      <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm" multiple={multiple} className="sr-only" onChange={(e) => e.target.files && handle(e.target.files)} />
      {uploading ? (
        <div className="w-full space-y-2">
          {Object.entries(progress).map(([name, p]) => (
            <div key={name} className="text-left text-xs text-ink-soft">
              <p className="truncate">{name}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-teal-strong transition-[width]" style={{ width: `${p}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Upload className="size-6 text-teal-strong" aria-hidden="true" />
          {!compact && <p className="text-sm font-semibold text-ink">Arrastrá fotos acá</p>}
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-strong ring-1 ring-line">
            {compact ? 'Subir' : 'Elegir archivos'}
          </button>
          {!compact && <p className="text-xs text-ink-soft">JPG, PNG o WebP. Se optimizan solas.</p>}
        </>
      )}
    </div>
  );
}

/** Biblioteca de medios para elegir una o varias imágenes */
export function MediaLibrary({ selected, onToggle, kind = 'IMAGE' }: { selected: string[]; onToggle: (m: Media) => void; kind?: 'IMAGE' | 'VIDEO' }) {
  const [q, setQ] = useState('');
  const query = useInfiniteQuery({
    queryKey: ['media', kind, q],
    queryFn: ({ pageParam }) => get<Paginated<Media>>(`/admin/media?page=${pageParam}&pageSize=48&kind=${kind}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descripción u origen (ej. perfumes, instagram)" className="h-11 w-full rounded-xl bg-white pl-10 pr-3 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-teal-strong" />
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button key={m.id} type="button" onClick={() => onToggle(m)} className={cn('group relative overflow-hidden rounded-xl ring-2 transition', on ? 'ring-teal-strong' : 'ring-transparent hover:ring-line')}>
              <Img media={m} ratio="4/5" sizes="140px" />
              <span className={cn('absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full transition', on ? 'bg-teal-strong text-white' : 'bg-white/80 text-transparent group-hover:text-ink-soft')}>
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {query.isLoading && <Loader2 className="mx-auto mt-6 size-6 animate-spin text-ink-soft" />}
      {query.hasNextPage && (
        <button type="button" onClick={() => query.fetchNextPage()} className="mx-auto mt-4 block rounded-full px-4 py-2 text-sm font-semibold text-teal-strong hover:bg-foam">
          {query.isFetchingNextPage ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </div>
  );
}

/** Selector de imágenes de un producto/historia: ordenar arrastrando, quitar, subir o elegir de la biblioteca */
export function ImagesField({ value, onChange, max = 8, label = 'Fotos' }: { value: Media[]; onChange: (v: Media[]) => void; max?: number; label?: string }) {
  const [libOpen, setLibOpen] = useState(false);
  const toggle = (m: Media) => {
    if (value.some((v) => v.id === m.id)) onChange(value.filter((v) => v.id !== m.id));
    else if (value.length < max) onChange([...value, m]);
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <button type="button" onClick={() => setLibOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-strong">
          <ImagePlus className="size-4" /> Elegir de la biblioteca
        </button>
      </div>
      <Reorder.Group axis="x" values={value} onReorder={onChange} className="flex flex-wrap gap-2.5">
        <AnimatePresence initial={false}>
          {value.map((m, i) => (
            <Reorder.Item key={m.id} value={m} className="relative w-24 cursor-grab touch-none active:cursor-grabbing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Img media={m} ratio="4/5" sizes="96px" className="rounded-xl" />
              {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.65rem] font-semibold text-white">Portada</span>}
              <GripVertical className="absolute left-1 top-1.5 size-4 text-white drop-shadow" />
              <button type="button" onClick={() => onChange(value.filter((v) => v.id !== m.id))} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-white text-ink shadow ring-1 ring-line" aria-label="Quitar imagen">
                <X className="size-3.5" />
              </button>
            </Reorder.Item>
          ))}
        </AnimatePresence>
        {value.length < max && (
          <div className="w-24">
            <UploadDrop compact onUploaded={(ms) => onChange([...value, ...ms].slice(0, max))} />
          </div>
        )}
      </Reorder.Group>
      <p className="mt-2 text-xs text-ink-soft">Arrastrá para ordenar. La primera es la portada.</p>
      <EditorDrawer open={libOpen} onClose={() => setLibOpen(false)} title="Biblioteca de medios" footer={<button type="button" onClick={() => setLibOpen(false)} className="h-11 w-full rounded-full bg-teal-strong font-semibold text-white">Listo ({value.length})</button>}>
        <MediaLibrary selected={value.map((v) => v.id)} onToggle={toggle} />
      </EditorDrawer>
    </div>
  );
}

/** Una sola imagen (portada de categoría, banner, etc.) */
export function SingleImageField({ value, onChange, label }: { value: Media | null; onChange: (m: Media | null) => void; label: string }) {
  const [libOpen, setLibOpen] = useState(false);
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <div className="flex items-start gap-3">
        <div className="w-28 shrink-0">
          {value ? (
            <div className="relative">
              <Img media={value} ratio="4/5" sizes="112px" className="rounded-xl" />
              <button type="button" onClick={() => onChange(null)} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-white shadow ring-1 ring-line" aria-label="Quitar">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <UploadDrop compact multiple={false} onUploaded={(ms) => onChange(ms[0] ?? null)} />
          )}
        </div>
        <button type="button" onClick={() => setLibOpen(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-teal-strong hover:bg-foam">
          <ImagePlus className="size-4" /> Elegir de la biblioteca
        </button>
      </div>
      <EditorDrawer open={libOpen} onClose={() => setLibOpen(false)} title="Elegir imagen">
        <MediaLibrary
          selected={value ? [value.id] : []}
          onToggle={(m) => {
            onChange(m);
            setLibOpen(false);
          }}
        />
      </EditorDrawer>
    </div>
  );
}

/** Etiquetas libres (notas olfativas, palabras clave, tags) */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState('');
  const commit = () => {
    const parts = text
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setText('');
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-teal-strong">
      {value.map((t) => (
        <motion.span layout key={t} className="inline-flex items-center gap-1 rounded-full bg-foam py-1 pl-2.5 pr-1 text-sm text-ink">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="grid size-5 place-items-center rounded-full hover:bg-line" aria-label={`Quitar ${t}`}>
            <X className="size-3" />
          </button>
        </motion.span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="h-8 min-w-[8rem] flex-1 bg-transparent px-1.5 text-[0.95rem] outline-none"
      />
    </div>
  );
}
