/**
 * Videos de producto (Kling 4.0, verticales 9:16, sin audio) servidos desde /public/media/productos.
 * Se muestran primero en la galería de la ficha. La clave es el slug del producto.
 */
export interface ProductVideo {
  src: string;
  poster: string;
  label: string;
}

const v = (file: string, label: string): ProductVideo => ({
  src: `/media/productos/${file}.mp4`,
  poster: `/media/productos/${file}.webp`,
  label,
});

export const PRODUCT_VIDEOS: Record<string, ProductVideo[]> = {
  'dior-j-adore': [v('dior-j-adore', "Dior J'adore")],
  'versace-crystal-noir': [v('versace-crystal-noir', 'Versace Crystal Noir')],
  'dolce-gabbana-devotion': [v('dolce-gabbana-devotion', 'Dolce & Gabbana Devotion')],
  'carolina-herrera-la-bomba': [v('carolina-herrera-la-bomba', 'Carolina Herrera La Bomba')],
  'versace-eros': [v('versace-eros', 'Versace Eros')],
  'dolce-gabbana-the-one-gold': [v('dolce-gabbana-the-one-gold', 'Dolce & Gabbana The One Gold')],
  'kenzo-kenzo-homme-intense': [v('kenzo-homme-intense', 'Kenzo Homme Intense')],
  'rabanne-phantom': [v('rabanne-phantom', 'Rabanne Phantom')],
  'stanley-stanley-vasos-botellas-y-termos': [
    v('stanley-termo-verde', 'Termo Stanley Classic verde'),
    v('stanley-termo-lake', 'Termo Stanley Classic Lake'),
    v('stanley-termo-blanco-rosa', 'Termo Stanley Classic blanco y rosa'),
    v('stanley-shaker-azul', 'Botella shaker Stanley azul'),
    v('stanley-shaker-fucsia', 'Botella shaker Stanley fucsia'),
    v('stanley-iceflow-rosa', 'Vaso Stanley IceFlow rosa'),
  ],
};

export function productVideos(slug: string): ProductVideo[] {
  return PRODUCT_VIDEOS[slug] ?? [];
}
