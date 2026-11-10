import type { Highlight, HighlightItem, Media, ProductDetail } from './types';

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

/** Imagen "falsa" (archivo estático de /public) con la forma de Media para reutilizar <Img> */
function staticMedia(id: string, path: string, w = 720, h = 1280): Media {
  return { id, kind: 'IMAGE', path, variants: null, width: w, height: h, blurDataUrl: null, dominantColor: null, alt: null };
}

const VIDEO_MS = 15000;

/** Orden de las historias de video (perfumes) */
const FRAGANCIAS = [
  'versace-crystal-noir',
  'dior-j-adore',
  'dolce-gabbana-devotion',
  'kenzo-kenzo-homme-intense',
  'versace-eros',
  'dolce-gabbana-the-one-gold',
  'carolina-herrera-la-bomba',
  'rabanne-phantom',
];
const STANLEY = 'stanley-stanley-vasos-botellas-y-termos';

/** Slugs de productos que hace falta traer para armar las historias de video */
export const VIDEO_HIGHLIGHT_SLUGS = [...FRAGANCIAS, STANLEY];

function item(highlightId: string, slug: string, vid: ProductVideo, k: number, product: ProductDetail | null | undefined): HighlightItem {
  const id = `${highlightId}-${k}`;
  return {
    id,
    highlightId,
    mediaId: id,
    caption: null,
    productId: product?.id ?? null,
    linkUrl: product ? null : `/producto/${slug}`,
    durationMs: VIDEO_MS,
    sortOrder: k,
    media: staticMedia(id, vid.poster),
    product: product
      ? {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.showPrice ? product.price : null,
          cashPrice: product.showPrice ? product.cashPrice : null,
          presentation: product.presentation,
          brand: product.brand ? { name: product.brand.name } : null,
        }
      : null,
    video: { src: vid.src, poster: vid.poster },
  };
}

/**
 * Historias destacadas con los videos de producto: "Fragancias" (un video por perfume, con su ficha)
 * y "Stanley" (los seis videos, con la ficha de Stanley). Solo incluye productos que existen y están activos.
 */
export function videoHighlights(products: Record<string, ProductDetail | null | undefined>): Highlight[] {
  const out: Highlight[] = [];
  const perfumes = FRAGANCIAS.filter((slug) => products[slug]).map((slug, k) => item('video-fragancias', slug, PRODUCT_VIDEOS[slug]![0]!, k, products[slug]));
  if (perfumes.length) {
    out.push({
      id: 'video-fragancias',
      slug: 'video-fragancias',
      title: 'Fragancias',
      coverId: null,
      sortOrder: -2,
      active: true,
      cover: staticMedia('cover-fragancias', '/media/productos/historia-fragancias.webp', 400, 400),
      items: perfumes,
    });
  }
  const stanley = products[STANLEY];
  if (stanley) {
    out.push({
      id: 'video-stanley',
      slug: 'video-stanley',
      title: 'Stanley',
      coverId: null,
      sortOrder: -1,
      active: true,
      cover: staticMedia('cover-stanley', '/media/productos/historia-stanley.webp', 400, 400),
      items: (PRODUCT_VIDEOS[STANLEY] ?? []).map((vid, k) => item('video-stanley', STANLEY, vid, k, stanley)),
    });
  }
  return out;
}
