'use client';

import { activeBadge, CrudPage } from '@/components/admin/crud';

export default function InsurersAdminPage() {
  return (
    <CrudPage
      title="Obras sociales"
      text="La lista que se ve en la web y en el formulario de pedido."
      queryKey="admin-insurers"
      listPath="/admin/insurers"
      basePath="/admin/insurers"
      publicTags={['content', 'store']}
      newLabel="Agregar obra social"
      rowTitle={(r) => String(r.name)}
      rowSubtitle={(r) => (r.fullName as string) ?? ''}
      rowBadges={activeBadge}
      defaults={{ active: true }}
      fields={[
        { key: 'name', label: 'Nombre corto', type: 'text', required: true },
        { key: 'fullName', label: 'Nombre completo', type: 'text' },
        { key: 'note', label: 'Nota', type: 'text', hint: 'Ej.: Solo recetas electrónicas' },
        { key: 'active', label: 'Visible', type: 'switch' },
      ]}
    />
  );
}
