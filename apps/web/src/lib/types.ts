/** Tipos de las respuestas de la API (NestJS) */

export type MediaVariants = { sm: string; md: string; lg: string };

export interface Media {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  path: string;
  variants: MediaVariants | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  dominantColor: string | null;
  alt: string | null;
}

export type Gender = 'FEMENINO' | 'MASCULINO' | 'UNISEX';

export interface BrandRef {
  id: string;
  name: string;
  slug: string;
  origin?: string | null;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  accent: string | null;
  parent?: { name: string; slug: string } | null;
}

export interface ProductImage {
  id: string;
  mediaId: string;
  sortOrder: number;
  media: Media;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string | null;
  categoryId: string;
  shortDescription: string | null;
  description: string | null;
  presentation: string | null;
  gender: Gender | null;
  price: number | null;
  cashPrice: number | null;
  compareAtPrice: number | null;
  showPrice: boolean;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  highlights: string[];
  tags: string[];
  attributes: Record<string, string> | null;
  featured: boolean;
  isNew: boolean;
  hasDecant: boolean;
  available: boolean;
  active: boolean;
  sortOrder: number;
  views: number;
  source: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  brand: BrandRef | null;
  category: CategoryRef;
  images: ProductImage[];
}

export interface ProductDetail extends Product {
  related: Product[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  accent: string | null;
  coverId: string | null;
  parentId: string | null;
  sortOrder: number;
  featured: boolean;
  active: boolean;
  cover: Media | null;
  productCount: number;
  children?: { id: string; name: string; slug: string }[];
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  origin: string | null;
  logoId: string | null;
  featured: boolean;
  logo: Media | null;
  productCount: number;
}

export interface Facets {
  brands: { name: string; slug: string; count: number }[];
  categories: { name: string; slug: string; icon: string | null; count: number }[];
  tags: { tag: string; count: number }[];
}

export interface HighlightProduct {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  cashPrice: number | null;
  presentation: string | null;
  brand: { name: string } | null;
}

export interface HighlightItem {
  id: string;
  highlightId: string;
  mediaId: string;
  caption: string | null;
  productId: string | null;
  linkUrl: string | null;
  durationMs: number;
  sortOrder: number;
  media: Media;
  product: HighlightProduct | null;
}

export interface Highlight {
  id: string;
  slug: string;
  title: string;
  coverId: string | null;
  sortOrder: number;
  active: boolean;
  cover: Media | null;
  items: HighlightItem[];
}

export type BannerPlacement = 'HOME_HERO' | 'HOME_PROMO' | 'CATALOG';

export interface Banner {
  id: string;
  placement: BannerPlacement;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  mediaId: string | null;
  mobileMediaId: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  media: Media | null;
  mobileMedia: Media | null;
}

export interface Insurer {
  id: string;
  slug: string;
  name: string;
  fullName: string | null;
  note: string | null;
  active: boolean;
  sortOrder: number;
}

export interface InstagramPost {
  id: string;
  code: string;
  type: 'REEL' | 'POST';
  caption: string | null;
  permalink: string;
  postedAt: string | null;
  coverId: string | null;
  featured: boolean;
  visible: boolean;
  cover: Media | null;
}

export type Season = 'REGULAR' | 'SUMMER';
export interface TimeRange {
  opens: string;
  closes: string;
}
export interface WeekDay {
  weekday: number;
  label: string;
  ranges: TimeRange[];
}

export interface SpecialDay {
  id: string;
  date: string;
  label: string;
  closed: boolean;
  opens: string | null;
  closes: string | null;
}

export interface StoreHours {
  season: Season;
  weekday: number;
  isOpen: boolean;
  closesAt: string | null;
  closingSoon: boolean;
  next: { weekday: number; dayLabel: string; opens: string } | null;
  today: TimeRange[];
  todaySpecial: { label: string; closed: boolean } | null;
  upcomingSpecialDays: SpecialDay[];
  weeks: Record<Season, WeekDay[]>;
}

export interface StoreInfo {
  name: string;
  tagline: string;
  since?: number;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  province: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  instagram: string;
  instagramUrl: string;
  benefits?: { title: string; text: string; icon?: string }[];
  [key: string]: unknown;
}

export interface PublicStore {
  info: StoreInfo | null;
  hours: StoreHours;
  stats: { insurers: number; products: number };
}

export type OrderStatus = 'NEW' | 'CONTACTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type DeliveryMethod = 'PICKUP' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  unitPrice: number | null;
  quantity: number;
  option: string | null;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod | null;
  insurance: string | null;
  notes: string | null;
  adminNotes: string | null;
  status: OrderStatus;
  total: number | null;
  channel: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  productId: string | null;
  handled: boolean;
  createdAt: string;
  product: { name: string; slug: string } | null;
}

export type Role = 'ADMIN' | 'EDITOR';
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AdminStats {
  totals: {
    products: number;
    activeProducts: number;
    featured: number;
    categories: number;
    brands: number;
    ordersNew: number;
    orders7: number;
    orders30: number;
    inquiriesPending: number;
  };
  byStatus: Partial<Record<OrderStatus, number>>;
  daily: { day: string; count: number }[];
  topViewed: Product[];
  recentOrders: Order[];
  hours: { isOpen: boolean; season: Season; closesAt: string | null; next: StoreHours['next'] };
}
