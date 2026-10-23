import localFont from 'next/font/local';

/**
 * Figtree: sans geométrica y cálida, de la misma familia visual que el logotipo (UI y textos).
 * El subset "latin" ya incluye todos los caracteres del español (á, é, ñ, ü, ¿, ¡).
 */
export const figtree = localFont({
  src: [{ path: '../fonts/figtree-latin-wght-normal.woff2', weight: '300 900', style: 'normal' }],
  variable: '--font-figtree',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
});

/** Young Serif: serif de herencia, como las etiquetas de botica (titulares y nombres de productos) */
export const youngSerif = localFont({
  src: [{ path: '../fonts/young-serif-latin-400-normal.woff2', weight: '400', style: 'normal' }],
  variable: '--font-young',
  display: 'swap',
  fallback: ['ui-serif', 'Georgia', 'serif'],
});
