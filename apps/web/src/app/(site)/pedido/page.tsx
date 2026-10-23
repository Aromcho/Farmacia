import type { Metadata } from 'next';
import { CheckoutView } from '@/components/cart/checkout-view';
import { getInsurers, getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Mi pedido',
  description: 'Armá tu pedido y envialo por WhatsApp. Retiro en 106 y Boulevard o envío a domicilio sin cargo en Villa Gesell.',
  robots: { index: false },
};

export default async function OrderPage() {
  const [insurers, featured] = await Promise.all([getInsurers(), getProducts({ featured: true, pageSize: 10 })]);
  return (
    <div className="mb-tabbar pt-[calc(var(--header-h)+env(safe-area-inset-top))]">
      <CheckoutView insurers={insurers.map((i) => i.name)} suggestions={featured.items} />
    </div>
  );
}
