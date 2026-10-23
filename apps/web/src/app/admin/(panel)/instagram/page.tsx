'use client';

import { Eye, EyeOff, Star } from 'lucide-react';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { Img } from '@/components/ui/img';
import { useAdminMutation, useAdminQuery } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { InstagramPost } from '@/lib/types';

export default function InstagramAdminPage() {
  const { data, isLoading } = useAdminQuery<InstagramPost[]>(['admin-instagram'], '/admin/instagram');
  const update = useAdminMutation<{ id: string; visible?: boolean; featured?: boolean }>({
    method: 'PATCH',
    path: (v) => `/admin/instagram/${v.id}`,
    body: ({ id: _id, ...rest }) => rest,
    invalidate: [['admin-instagram']],
    publicTags: ['content'],
  });
  return (
    <>
      <PageHeader title="Instagram" text="Publicaciones relevadas de @farmacia.amancio.fernandez. Elegí cuáles se muestran en la web y cuáles van primero." />
      {isLoading ? (
        <LoadingBlock />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data?.map((p) => (
            <li key={p.id} className={cn('overflow-hidden rounded-2xl bg-white ring-1 ring-line', !p.visible && 'opacity-50')}>
              <a href={p.permalink} target="_blank" rel="noopener noreferrer">
                <Img media={p.cover} ratio="4/5" sizes="200px" />
              </a>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="tabular text-xs text-ink-soft">{formatDate(p.postedAt, { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                <span className="flex">
                  <button type="button" onClick={() => update.mutate({ id: p.id, featured: !p.featured })} className="grid size-8 place-items-center rounded-full hover:bg-mist" aria-label="Destacar">
                    <Star className={cn('size-4', p.featured ? 'fill-sun text-sun' : 'text-ink-soft')} />
                  </button>
                  <button type="button" onClick={() => update.mutate({ id: p.id, visible: !p.visible })} className="grid size-8 place-items-center rounded-full hover:bg-mist" aria-label={p.visible ? 'Ocultar' : 'Mostrar'}>
                    {p.visible ? <Eye className="size-4 text-teal-strong" /> : <EyeOff className="size-4 text-ink-soft" />}
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
