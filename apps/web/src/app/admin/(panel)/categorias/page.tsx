'use client';

import { activeBadge, CrudPage } from '@/components/admin/crud';
import type { Media } from '@/lib/types';

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Categorías"
      text="Las secciones del catálogo. Arrastrá para cambiar el orden en que aparecen en la web."
      queryKey="admin-categories"
      listPath="/admin/categories"
      basePath="/admin/categories"
      reorderPath="/admin/categories/reorder"
      publicTags={['catalog']}
      newLabel="Nueva categoría"
      rowTitle={(r) => String(r.name)}
      rowSubtitle={(r) => `${r.productCount ?? 0} productos · ${r.tagline ?? ''}`}
      rowImage={(r) => r.cover as Media | null}
      rowBadges={activeBadge}
      fields={[
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'tagline', label: 'Bajada corta', type: 'text', hint: 'Aparece en la tarjeta de la categoría' },
        { key: 'description', label: 'Descripción', type: 'textarea' },
        { key: 'coverId', label: 'Foto de portada', type: 'image', mediaKey: 'cover' },
        { key: 'accent', label: 'Color de acento', type: 'color' },
        { key: 'featured', label: 'Destacada en el inicio', type: 'switch' },
        { key: 'active', label: 'Visible en la web', type: 'switch' },
      ]}
    />
  );
}
