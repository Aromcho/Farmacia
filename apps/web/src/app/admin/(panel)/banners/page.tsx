'use client';

import { activeBadge, CrudPage } from '@/components/admin/crud';
import type { Media } from '@/lib/types';

const PLACEMENTS = [
  { value: 'HOME_PROMO', label: 'Inicio · promoción' },
  { value: 'HOME_HERO', label: 'Inicio · portada' },
  { value: 'CATALOG', label: 'Catálogo' },
];

export default function BannersPage() {
  return (
    <CrudPage
      title="Banners y promociones"
      text="Avisos con foto y botón. Podés programar desde y hasta cuándo se muestran."
      queryKey="admin-banners"
      listPath="/admin/banners"
      basePath="/admin/banners"
      publicTags={['content']}
      newLabel="Nuevo banner"
      rowTitle={(r) => String(r.title)}
      rowSubtitle={(r) => PLACEMENTS.find((p) => p.value === r.placement)?.label ?? ''}
      rowImage={(r) => r.media as Media | null}
      rowBadges={activeBadge}
      defaults={{ placement: 'HOME_PROMO', active: true }}
      fields={[
        { key: 'placement', label: 'Dónde se muestra', type: 'select', options: PLACEMENTS },
        { key: 'eyebrow', label: 'Etiqueta', type: 'text', hint: 'Ej.: Decants' },
        { key: 'title', label: 'Título', type: 'text', required: true },
        { key: 'subtitle', label: 'Texto', type: 'textarea' },
        { key: 'ctaLabel', label: 'Texto del botón', type: 'text' },
        { key: 'ctaHref', label: 'Link del botón', type: 'text', hint: 'Ej.: /catalogo?decant=true' },
        { key: 'mediaId', label: 'Imagen', type: 'image', mediaKey: 'media' },
        { key: 'startsAt', label: 'Desde (opcional)', type: 'datetime' },
        { key: 'endsAt', label: 'Hasta (opcional)', type: 'datetime' },
        { key: 'active', label: 'Activo', type: 'switch' },
      ]}
    />
  );
}
