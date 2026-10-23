'use client';

import { MediaLibrary, UploadDrop } from '@/components/admin/media';
import { DeleteButton, EditorDrawer, Field, Input, PageHeader } from '@/components/admin/ui';
import { Img } from '@/components/ui/img';
import { useAdminMutation } from '@/lib/admin';
import type { Media } from '@/lib/types';
import { useState } from 'react';

export default function MediaPage() {
  const [sel, setSel] = useState<Media | null>(null);
  const [alt, setAlt] = useState('');
  const save = useAdminMutation<{ alt: string }>({ method: 'PATCH', path: `/admin/media/${sel?.id}`, invalidate: [['media']], success: 'Descripción guardada', onSuccess: () => setSel(null) });
  const remove = useAdminMutation({ method: 'DELETE', path: `/admin/media/${sel?.id}`, invalidate: [['media']], publicTags: ['catalog', 'content'], success: 'Archivo eliminado', onSuccess: () => setSel(null) });
  return (
    <>
      <PageHeader title="Biblioteca de medios" text="Todas las fotos y videos. Se optimizan automáticamente (WebP en 3 tamaños)." />
      <UploadDrop onUploaded={() => {}} />
      <div className="mt-6">
        <MediaLibrary
          selected={sel ? [sel.id] : []}
          onToggle={(m) => {
            setSel(m);
            setAlt(m.alt ?? '');
          }}
        />
      </div>
      <EditorDrawer
        open={!!sel}
        onClose={() => setSel(null)}
        title="Detalle de la imagen"
        footer={
          <div className="flex justify-between">
            <DeleteButton onConfirm={() => remove.mutate(undefined)} pending={remove.isPending} />
            <button type="button" onClick={() => save.mutate({ alt })} className="h-11 rounded-full bg-teal-strong px-6 font-semibold text-white">
              Guardar
            </button>
          </div>
        }
      >
        {sel && (
          <div className="space-y-5">
            <Img media={sel} sizes="500px" fit="contain" className="rounded-2xl" style={{ aspectRatio: `${sel.width ?? 4}/${sel.height ?? 5}` }} />
            <Field label="Descripción (texto alternativo)" hint="Ayuda a Google y a personas con lectores de pantalla">
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <p className="text-xs text-ink-soft">
              {sel.width}×{sel.height} px · /uploads/{sel.path}
            </p>
          </div>
        )}
      </EditorDrawer>
    </>
  );
}
