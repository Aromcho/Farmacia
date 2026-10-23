/**
 * Carga inicial de la base con el relevamiento del Instagram de @farmacia.amancio.fernandez:
 * categorías, marcas, productos con sus fotos reales, historias destacadas, publicaciones,
 * obras sociales, horarios (verano / resto del año), banners y datos de contacto.
 *
 * Uso:  npm run seed            → carga si la base está vacía (siempre asegura el usuario admin)
 *       npm run seed -- --reset → borra catálogo y contenidos y vuelve a cargar todo
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Pool } from 'pg';
import { processImage } from '../media/image-pipeline';
import * as schema from './schema';
import {
  banners,
  brands,
  categories,
  highlightItems,
  highlights,
  instagramPosts,
  insuranceProviders,
  media,
  openingHours,
  productImages,
  products,
  settings,
  users,
} from './schema';

const SEED_DIR = resolve(__dirname, '../../seed');
const UPLOADS = resolve(process.env.UPLOADS_DIR ?? './uploads');
const RESET = process.argv.includes('--reset');

type Gender = 'FEMENINO' | 'MASCULINO' | 'UNISEX';
interface CatalogFile {
  categories: { slug: string; name: string; icon: string; accent: string; tagline: string; description: string; coverFile: string }[];
  brands: { name: string; origin: string | null }[];
  products: {
    slug: string;
    name: string;
    brand: string | null;
    cat: string;
    presentation: string | null;
    gender: Gender | null;
    price: number | null;
    cash: number | null;
    short: string | null;
    desc: string | null;
    notes: [string[], string[], string[]];
    highlights: string[];
    tags: string[];
    attrs: Record<string, string>;
    featured: boolean;
    isNew: boolean;
    decant: boolean;
    imageFiles: string[];
    src: string;
  }[];
}
interface ContentFile {
  highlights: { title: string; cover: string; items: { file: string; productSlug: string | null; caption: string | null; linkUrl: string | null; durationMs: number }[] }[];
  posts: { code: string; type: 'REEL' | 'POST'; caption: string; permalink: string; postedAt: string | null; cover: string; visible: boolean; featured: boolean }[];
  insurers: { name: string; fullName: string | null }[];
  store: Record<string, unknown>;
  hours: { season: 'REGULAR' | 'SUMMER'; weekday: number; opens: string; closes: string }[];
  banners: { placement: 'HOME_PROMO' | 'HOME_HERO' | 'CATALOG'; eyebrow: string; title: string; subtitle: string; ctaLabel: string; ctaHref: string; image: string }[];
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // ---------------------------------------------------------------- admin
  const email = (process.env.ADMIN_EMAIL ?? 'admin@farmacia.local').toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD ?? 'cambiar-esta-clave';
    await db.insert(users).values({ email, name: process.env.ADMIN_NAME ?? 'Administración', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) });
    console.log(`✓ Usuario admin creado: ${email}`);
  }

  // ---------------------------------------------------------------- ¿ya hay datos?
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  if (n > 0 && !RESET) {
    console.log(`La base ya tiene ${n} productos. Usá "npm run seed -- --reset" para volver a cargar todo.`);
    await pool.end();
    return;
  }
  if (RESET) {
    await db.execute(sql`TRUNCATE highlight_items, highlights, product_images, products, brands, categories, banners, instagram_posts, insurance_providers, opening_hours, media RESTART IDENTITY CASCADE`);
    console.log('· Catálogo y contenidos borrados');
  }

  const catalog: CatalogFile = JSON.parse(readFileSync(join(SEED_DIR, 'catalog.json'), 'utf8'));
  const content: ContentFile = JSON.parse(readFileSync(join(SEED_DIR, 'content.json'), 'utf8'));

  // ---------------------------------------------------------------- medios
  const mediaCache = new Map<string, string>();
  let processed = 0;
  async function image(file: string, alt: string, source: string, folder: string): Promise<string> {
    const key = `${folder}:${file}`;
    const hit = mediaCache.get(key);
    if (hit) return hit;
    const path = join(SEED_DIR, 'images', file);
    if (!existsSync(path)) throw new Error(`Falta la imagen ${path}`);
    const out = await processImage(readFileSync(path), UPLOADS, { folder: `seed/${folder}` });
    const [row] = await db
      .insert(media)
      .values({ kind: 'IMAGE', path: out.path, variants: out.variants, width: out.width, height: out.height, alt, blurDataUrl: out.blurDataUrl, dominantColor: out.dominantColor, mime: out.mime, sizeBytes: out.sizeBytes, source })
      .returning({ id: media.id });
    mediaCache.set(key, row.id);
    processed++;
    if (processed % 25 === 0) console.log(`  · ${processed} imágenes procesadas…`);
    return row.id;
  }

  // ---------------------------------------------------------------- categorías
  const catIds = new Map<string, string>();
  for (const [i, c] of catalog.categories.entries()) {
    const coverId = await image(c.coverFile, c.name, 'instagram', 'categorias');
    const [row] = await db
      .insert(categories)
      .values({ slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, icon: c.icon, accent: c.accent, coverId, sortOrder: i, featured: i < 6 })
      .returning({ id: categories.id });
    catIds.set(c.slug, row.id);
  }
  console.log(`✓ ${catIds.size} categorías`);

  // ---------------------------------------------------------------- marcas
  const brandIds = new Map<string, string>();
  for (const b of catalog.brands) {
    const [row] = await db.insert(brands).values({ slug: slugify(b.name), name: b.name, origin: b.origin }).returning({ id: brands.id });
    brandIds.set(b.name, row.id);
  }

  // ---------------------------------------------------------------- productos
  const productIds = new Map<string, string>();
  for (const [i, p] of catalog.products.entries()) {
    const label = [p.brand, p.name].filter(Boolean).join(' ');
    const imageIds: string[] = [];
    for (const f of p.imageFiles) imageIds.push(await image(f, label, p.src, 'productos'));
    const [row] = await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        brandId: p.brand ? (brandIds.get(p.brand) ?? null) : null,
        categoryId: catIds.get(p.cat)!,
        shortDescription: p.short,
        description: p.desc,
        presentation: p.presentation,
        gender: p.gender,
        price: p.price,
        cashPrice: p.cash,
        showPrice: p.price !== null || p.cash !== null,
        notesTop: p.notes[0],
        notesHeart: p.notes[1],
        notesBase: p.notes[2],
        highlights: p.highlights,
        tags: p.tags,
        attributes: Object.keys(p.attrs).length ? p.attrs : null,
        featured: p.featured,
        isNew: p.isNew,
        hasDecant: p.decant,
        sortOrder: i,
        source: p.src,
        sourceUrl: p.src.startsWith('instagram:') ? `https://www.instagram.com/p/${p.src.split(':')[1]}/` : 'https://www.instagram.com/farmacia.amancio.fernandez/',
      })
      .returning({ id: products.id });
    productIds.set(p.slug, row.id);
    if (imageIds.length) await db.insert(productImages).values(imageIds.map((mediaId, k) => ({ productId: row.id, mediaId, sortOrder: k })));
  }
  // marcas sin productos fuera
  await db.execute(sql`DELETE FROM brands b WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id)`);
  console.log(`✓ ${productIds.size} productos`);

  // ---------------------------------------------------------------- historias destacadas
  for (const [i, h] of content.highlights.entries()) {
    const coverId = await image(h.cover, h.title, `highlight:${h.title}`, 'historias');
    const [row] = await db.insert(highlights).values({ slug: slugify(h.title), title: h.title, coverId, sortOrder: i }).returning({ id: highlights.id });
    const items = [];
    for (const [k, it] of h.items.entries()) {
      items.push({
        highlightId: row.id,
        mediaId: await image(it.file, h.title, `highlight:${h.title}`, 'historias'),
        caption: it.caption,
        productId: it.productSlug ? (productIds.get(it.productSlug) ?? null) : null,
        linkUrl: it.linkUrl,
        durationMs: it.durationMs,
        sortOrder: k,
      });
    }
    if (items.length) await db.insert(highlightItems).values(items);
  }
  console.log(`✓ ${content.highlights.length} historias destacadas`);

  // ---------------------------------------------------------------- Instagram
  for (const p of content.posts) {
    const coverId = await image(p.cover, p.caption.slice(0, 120), `instagram:${p.code}`, 'instagram');
    await db.insert(instagramPosts).values({ code: p.code, type: p.type, caption: p.caption, permalink: p.permalink, postedAt: p.postedAt ? new Date(p.postedAt) : null, coverId, visible: p.visible, featured: p.featured });
  }
  console.log(`✓ ${content.posts.length} publicaciones de Instagram`);

  // ---------------------------------------------------------------- banners
  for (const [i, b] of content.banners.entries()) {
    const mediaId = await image(b.image, b.title, 'instagram', 'banners');
    await db.insert(banners).values({ placement: b.placement, eyebrow: b.eyebrow, title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, ctaHref: b.ctaHref, mediaId, sortOrder: i });
  }

  // ---------------------------------------------------------------- obras sociales, horarios, ajustes
  await db.insert(insuranceProviders).values(content.insurers.map((x, i) => ({ slug: slugify(x.name), name: x.name, fullName: x.fullName, sortOrder: i })));
  await db.insert(openingHours).values(content.hours);
  for (const [key, value] of [
    ['store', content.store],
    ['season', { mode: 'AUTO', summerStart: '12-15', summerEnd: '03-15' }],
  ] as const) {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  console.log(`✓ ${content.insurers.length} obras sociales, horarios y datos de contacto`);
  console.log(`✓ ${processed} imágenes optimizadas en ${UPLOADS}`);
  await pool.end();
}

main().catch((err) => {
  console.error('✗ Error en el seed:', err);
  process.exit(1);
});
