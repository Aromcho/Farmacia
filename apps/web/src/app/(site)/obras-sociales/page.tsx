import type { Metadata } from 'next';
import { InsurersSearch } from '@/components/site/insurers-search';
import { getInsurers } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Obras sociales y prepagas',
  description: 'Obras sociales y prepagas con las que trabaja Farmacia Amancio Fernández en Villa Gesell: IOMA, PAMI, OSDE, Swiss Medical, Galeno, OSECAC y más.',
};

export default async function InsurersPage() {
  const insurers = await getInsurers();
  return (
    <div className="mb-tabbar pt-[calc(var(--header-h)+env(safe-area-inset-top))]">
      <div className="container-x pb-20 pt-10 lg:pt-16">
        <h1 className="display-2 max-w-2xl text-balance text-ink">Obras sociales y prepagas</h1>
        <p className="mt-3 max-w-[56ch] text-[1.05rem] text-ink-soft">
          Trabajamos con {insurers.length} coberturas. Traé tu receta y tu credencial; si no encontrás la tuya, escribinos por WhatsApp.
        </p>
        <div className="mt-10 max-w-5xl">
          <InsurersSearch insurers={insurers} />
        </div>
      </div>
    </div>
  );
}
