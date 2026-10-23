'use client';

import { CrudPage } from '@/components/admin/crud';
import type { Media } from '@/lib/types';

export default function BrandsPage() {
  return (
    <CrudPage
      title="Marcas"
      queryKey="admin-brands"
      listPath="/admin/brands"
      basePath="/admin/brands"
      publicTags={['catalog']}
      newLabel="Nueva marca"
      rowTitle={(r) => String(r.name)}
      rowSubtitle={(r) => [r.origin, `${r.productCount ?? 0} productos`].filter(Boolean).join(' · ')}
      rowImage={(r) => r.logo as Media | null}
      fields={[
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'origin', label: 'Origen', type: 'text', hint: 'Ej.: Francia, Emiratos Árabes Unidos' },
        { key: 'logoId', label: 'Logo', type: 'image', mediaKey: 'logo' },
        { key: 'featured', label: 'Destacada', type: 'switch' },
      ]}
      defaults={{ featured: false }}
    />
  );
}
