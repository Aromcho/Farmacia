/**
 * Modelo de datos — Farmacia Amancio Fernández
 * PostgreSQL + Drizzle ORM. Los precios se guardan en pesos enteros (ARS).
 */
import { relations, sql } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------- enums
export const roleEnum = pgEnum('role', ['ADMIN', 'EDITOR']);
export const genderEnum = pgEnum('gender', ['FEMENINO', 'MASCULINO', 'UNISEX']);
export const mediaKindEnum = pgEnum('media_kind', ['IMAGE', 'VIDEO']);
export const seasonEnum = pgEnum('season', ['REGULAR', 'SUMMER']);
export const orderStatusEnum = pgEnum('order_status', ['NEW', 'CONTACTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']);
export const deliveryMethodEnum = pgEnum('delivery_method', ['PICKUP', 'DELIVERY']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'CARD', 'TRANSFER', 'OTHER']);
export const bannerPlacementEnum = pgEnum('banner_placement', ['HOME_HERO', 'HOME_PROMO', 'CATALOG']);
export const postTypeEnum = pgEnum('post_type', ['REEL', 'POST']);

export type Role = (typeof roleEnum.enumValues)[number];
export type Gender = (typeof genderEnum.enumValues)[number];
export type MediaKind = (typeof mediaKindEnum.enumValues)[number];
export type Season = (typeof seasonEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type DeliveryMethod = (typeof deliveryMethodEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type BannerPlacement = (typeof bannerPlacementEnum.enumValues)[number];
export type PostType = (typeof postTypeEnum.enumValues)[number];

// ---------------------------------------------------------------- helpers
const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const textArray = (name: string) =>
  text(name)
    .array()
    .notNull()
    .default(sql`'{}'::text[]`);

export type MediaVariants = { sm: string; md: string; lg: string };

// ---------------------------------------------------------------- tablas
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('EDITOR'),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const media = pgTable('media', {
  id: id(),
  kind: mediaKindEnum('kind').notNull().default('IMAGE'),
  /** Ruta relativa dentro de /uploads (variante principal) */
  path: text('path').notNull(),
  variants: jsonb('variants').$type<MediaVariants>(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  blurDataUrl: text('blur_data_url'),
  dominantColor: text('dominant_color'),
  mime: text('mime'),
  sizeBytes: integer('size_bytes'),
  /** Origen: "instagram:<código>", "highlight:<nombre>", "upload", "kling" */
  source: text('source'),
  createdAt: createdAt(),
});

export const categories = pgTable('categories', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  icon: text('icon'),
  accent: text('accent'),
  coverId: uuid('cover_id').references(() => media.id, { onDelete: 'set null' }),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const brands = pgTable('brands', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  origin: text('origin'),
  logoId: uuid('logo_id').references(() => media.id, { onDelete: 'set null' }),
  featured: boolean('featured').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const products = pgTable(
  'products',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    shortDescription: text('short_description'),
    description: text('description'),
    /** "EDP 100 ml", "x22 parches", "350 g" */
    presentation: text('presentation'),
    gender: genderEnum('gender'),
    /** Precio de lista (tarjeta / cuotas), en pesos */
    price: integer('price'),
    /** Precio abonando en efectivo, en pesos */
    cashPrice: integer('cash_price'),
    /** Precio anterior para mostrar promo */
    compareAtPrice: integer('compare_at_price'),
    showPrice: boolean('show_price').notNull().default(true),
    notesTop: textArray('notes_top'),
    notesHeart: textArray('notes_heart'),
    notesBase: textArray('notes_base'),
    /** Palabras clave visibles: "Explosiva", "Femenina"... */
    highlights: textArray('highlights'),
    tags: textArray('tags'),
    attributes: jsonb('attributes').$type<Record<string, string>>(),
    featured: boolean('featured').notNull().default(false),
    isNew: boolean('is_new').notNull().default(false),
    hasDecant: boolean('has_decant').notNull().default(false),
    available: boolean('available').notNull().default(true),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    views: integer('views').notNull().default(0),
    source: text('source'),
    sourceUrl: text('source_url'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('products_category_idx').on(t.categoryId),
    index('products_brand_idx').on(t.brandId),
    index('products_active_featured_idx').on(t.active, t.featured),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: id(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('product_images_product_media_uq').on(t.productId, t.mediaId)],
);

/** Historias destacadas (como en Instagram) */
export const highlights = pgTable('highlights', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  coverId: uuid('cover_id').references(() => media.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const highlightItems = pgTable('highlight_items', {
  id: id(),
  highlightId: uuid('highlight_id')
    .notNull()
    .references(() => highlights.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
  caption: text('caption'),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  linkUrl: text('link_url'),
  durationMs: integer('duration_ms').notNull().default(5000),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const banners = pgTable('banners', {
  id: id(),
  placement: bannerPlacementEnum('placement').notNull().default('HOME_PROMO'),
  eyebrow: text('eyebrow'),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  ctaLabel: text('cta_label'),
  ctaHref: text('cta_href'),
  mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
  mobileMediaId: uuid('mobile_media_id').references(() => media.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Obras sociales / prepagas */
export const insuranceProviders = pgTable('insurance_providers', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  fullName: text('full_name'),
  note: text('note'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Franjas horarias por temporada y día (0 = domingo … 6 = sábado) */
export const openingHours = pgTable(
  'opening_hours',
  {
    id: id(),
    season: seasonEnum('season').notNull().default('REGULAR'),
    weekday: integer('weekday').notNull(),
    opens: text('opens').notNull(),
    closes: text('closes').notNull(),
  },
  (t) => [index('opening_hours_season_weekday_idx').on(t.season, t.weekday)],
);

/** Feriados y días especiales */
export const specialDays = pgTable('special_days', {
  id: id(),
  date: date('date', { mode: 'string' }).notNull(),
  label: text('label').notNull(),
  closed: boolean('closed').notNull().default(true),
  opens: text('opens'),
  closes: text('closes'),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const orders = pgTable(
  'orders',
  {
    id: id(),
    code: text('code').notNull().unique(),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address'),
    deliveryMethod: deliveryMethodEnum('delivery_method').notNull().default('PICKUP'),
    paymentMethod: paymentMethodEnum('payment_method'),
    insurance: text('insurance'),
    notes: text('notes'),
    adminNotes: text('admin_notes'),
    status: orderStatusEnum('status').notNull().default('NEW'),
    total: integer('total'),
    channel: text('channel').notNull().default('web'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('orders_status_created_idx').on(t.status, t.createdAt)],
);

export const orderItems = pgTable('order_items', {
  id: id(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  unitPrice: integer('unit_price'),
  quantity: integer('quantity').notNull().default(1),
  option: text('option'),
});

export const inquiries = pgTable('inquiries', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  message: text('message').notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  handled: boolean('handled').notNull().default(false),
  createdAt: createdAt(),
});

export const instagramPosts = pgTable('instagram_posts', {
  id: id(),
  code: text('code').notNull().unique(),
  type: postTypeEnum('type').notNull().default('POST'),
  caption: text('caption'),
  permalink: text('permalink').notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  coverId: uuid('cover_id').references(() => media.id, { onDelete: 'set null' }),
  featured: boolean('featured').notNull().default(false),
  visible: boolean('visible').notNull().default(true),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------- relaciones (para db.query)
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  cover: one(media, { fields: [categories.coverId], references: [media.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'tree' }),
  children: many(categories, { relationName: 'tree' }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  logo: one(media, { fields: [brands.logoId], references: [media.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  media: one(media, { fields: [productImages.mediaId], references: [media.id] }),
}));

export const highlightsRelations = relations(highlights, ({ one, many }) => ({
  cover: one(media, { fields: [highlights.coverId], references: [media.id] }),
  items: many(highlightItems),
}));

export const highlightItemsRelations = relations(highlightItems, ({ one }) => ({
  highlight: one(highlights, { fields: [highlightItems.highlightId], references: [highlights.id] }),
  media: one(media, { fields: [highlightItems.mediaId], references: [media.id] }),
  product: one(products, { fields: [highlightItems.productId], references: [products.id] }),
}));

export const bannersRelations = relations(banners, ({ one }) => ({
  media: one(media, { fields: [banners.mediaId], references: [media.id], relationName: 'bannerMedia' }),
  mobileMedia: one(media, { fields: [banners.mobileMediaId], references: [media.id], relationName: 'bannerMobileMedia' }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  product: one(products, { fields: [inquiries.productId], references: [products.id] }),
}));

export const instagramPostsRelations = relations(instagramPosts, ({ one }) => ({
  cover: one(media, { fields: [instagramPosts.coverId], references: [media.id] }),
}));

export const mediaRelations = relations(media, ({ many }) => ({
  productImages: many(productImages),
  bannersMedia: many(banners, { relationName: 'bannerMedia' }),
  bannersMobile: many(banners, { relationName: 'bannerMobileMedia' }),
}));
