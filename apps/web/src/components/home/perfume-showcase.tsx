'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { ProductRail } from '@/components/catalog/product-rail';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Product } from '@/lib/types';

export interface PerfumeTab {
  key: string;
  label: string;
  href: string;
  products: Product[];
}

/** Perfumería: el corazón de la farmacia, con pestañas Para ella / Para él / Árabes / Decants */
export function PerfumeShowcase({ tabs }: { tabs: PerfumeTab[] }) {
  const visible = tabs.filter((t) => t.products.length);
  const [active, setActive] = useState(visible[0]?.key);
  const current = visible.find((t) => t.key === active) ?? visible[0];
  if (!current) return null;

  return (
    <section className="py-16 lg:py-24" aria-labelledby="perfumeria-title">
      <div className="container-x">
        <SectionHeading
          id="perfumeria-title"
          title="Perfumería"
          text="Originales de diseñador, más de 120 fragancias árabes y nacionales. Si no sabés cuál elegir, te asesoramos."
        />
        <div role="tablist" aria-label="Tipo de perfume" className="scroll-x mt-7 gap-2">
          {visible.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={t.key === current.key}
              onClick={() => setActive(t.key)}
              className="relative shrink-0 rounded-full px-4.5 py-2.5 text-[0.92rem] font-semibold transition-colors aria-selected:text-white aria-[selected=false]:bg-foam aria-[selected=false]:text-ink-soft aria-[selected=false]:hover:text-ink"
            >
              {t.key === current.key && (
                <motion.span layoutId="perfume-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <motion.div key={current.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="mt-8">
          <ProductRail products={current.products} moreHref={current.href} moreLabel={`Ver todo: ${current.label.toLowerCase()}`} />
        </motion.div>
      </div>
    </section>
  );
}
