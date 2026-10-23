import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, isNull, lte, or, SQL } from 'drizzle-orm';
import { mediaColumns } from '../common/media';
import { slugify, uniqueSlug } from '../common/utils/slug';
import { Database, InjectDb } from '../db/db.module';
import { BannerPlacement, banners, highlightItems, highlights, insuranceProviders, instagramPosts } from '../db/schema';
import { HighlightItemDto, UpdateBannerDto, UpdateHighlightDto, UpdateInsurerDto, UpdatePostDto, UpsertBannerDto, UpsertHighlightDto, UpsertInsurerDto } from './dto/content.dto';

const toDate = (v?: string | null) => (v === undefined ? undefined : v === null ? null : new Date(v));

@Injectable()
export class ContentService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ---------- Historias destacadas ----------
  highlights(onlyActive = true) {
    return this.db.query.highlights.findMany({
      where: onlyActive ? eq(highlights.active, true) : undefined,
      orderBy: [asc(highlights.sortOrder)],
      with: {
        cover: { columns: mediaColumns },
        items: {
          orderBy: (it, { asc: a }) => [a(it.sortOrder)],
          with: {
            media: { columns: mediaColumns },
            product: {
              columns: { id: true, slug: true, name: true, price: true, cashPrice: true, presentation: true },
              with: { brand: { columns: { name: true } } },
            },
          },
        },
      },
    });
  }

  private async highlightById(id: string) {
    const rows = await this.highlights(false);
    const row = rows.find((h) => h.id === id);
    if (!row) throw new NotFoundException('Historia no encontrada');
    return row;
  }

  private itemsValues(highlightId: string, items: HighlightItemDto[]) {
    return items.map((it, i) => ({
      highlightId,
      mediaId: it.mediaId,
      caption: it.caption ?? null,
      productId: it.productId ?? null,
      linkUrl: it.linkUrl ?? null,
      durationMs: it.durationMs ?? 5000,
      sortOrder: i,
    }));
  }

  async createHighlight(dto: UpsertHighlightDto) {
    const slug = await uniqueSlug(dto.title, async (s) => !!(await this.db.query.highlights.findFirst({ where: eq(highlights.slug, s), columns: { id: true } })));
    const { items, ...data } = dto;
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(highlights).values({ ...data, slug }).returning({ id: highlights.id });
      if (items?.length) await tx.insert(highlightItems).values(this.itemsValues(row.id, items));
      return row.id;
    });
    return this.highlightById(id);
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto) {
    const { items, ...data } = dto;
    await this.db.transaction(async (tx) => {
      if (Object.keys(data).length) await tx.update(highlights).set(data).where(eq(highlights.id, id));
      if (items) {
        await tx.delete(highlightItems).where(eq(highlightItems.highlightId, id));
        if (items.length) await tx.insert(highlightItems).values(this.itemsValues(id, items));
      }
    });
    return this.highlightById(id);
  }

  async removeHighlight(id: string) {
    await this.db.delete(highlights).where(eq(highlights.id, id));
    return { ok: true };
  }

  async reorderHighlights(ids: string[]) {
    await this.db.transaction(async (tx) => {
      for (const [i, id] of ids.entries()) await tx.update(highlights).set({ sortOrder: i }).where(eq(highlights.id, id));
    });
    return { ok: true };
  }

  // ---------- Banners ----------
  banners(placement?: BannerPlacement, onlyLive = true) {
    const now = new Date();
    const conds: SQL[] = [];
    if (placement) conds.push(eq(banners.placement, placement));
    if (onlyLive) {
      conds.push(eq(banners.active, true));
      conds.push(or(isNull(banners.startsAt), lte(banners.startsAt, now))!);
      conds.push(or(isNull(banners.endsAt), gte(banners.endsAt, now))!);
    }
    return this.db.query.banners.findMany({
      where: conds.length ? and(...conds) : undefined,
      orderBy: [asc(banners.placement), asc(banners.sortOrder)],
      with: { media: { columns: mediaColumns }, mobileMedia: { columns: mediaColumns } },
    });
  }

  async createBanner(dto: UpsertBannerDto) {
    const [row] = await this.db
      .insert(banners)
      .values({ ...dto, startsAt: toDate(dto.startsAt), endsAt: toDate(dto.endsAt) })
      .returning();
    return row;
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    const [row] = await this.db
      .update(banners)
      .set({ ...dto, startsAt: toDate(dto.startsAt), endsAt: toDate(dto.endsAt) })
      .where(eq(banners.id, id))
      .returning();
    if (!row) throw new NotFoundException('Banner no encontrado');
    return row;
  }

  async removeBanner(id: string) {
    await this.db.delete(banners).where(eq(banners.id, id));
    return { ok: true };
  }

  // ---------- Obras sociales ----------
  insurers(onlyActive = true) {
    return this.db
      .select()
      .from(insuranceProviders)
      .where(onlyActive ? eq(insuranceProviders.active, true) : undefined)
      .orderBy(asc(insuranceProviders.sortOrder), asc(insuranceProviders.name));
  }

  async createInsurer(dto: UpsertInsurerDto) {
    const slug = await uniqueSlug(dto.name, async (s) => !!(await this.db.query.insuranceProviders.findFirst({ where: eq(insuranceProviders.slug, s), columns: { id: true } })));
    const [row] = await this.db.insert(insuranceProviders).values({ ...dto, slug }).returning();
    return row;
  }

  async updateInsurer(id: string, dto: UpdateInsurerDto) {
    const [row] = await this.db
      .update(insuranceProviders)
      .set({ ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) })
      .where(eq(insuranceProviders.id, id))
      .returning();
    if (!row) throw new NotFoundException('Obra social no encontrada');
    return row;
  }

  async removeInsurer(id: string) {
    await this.db.delete(insuranceProviders).where(eq(insuranceProviders.id, id));
    return { ok: true };
  }

  // ---------- Instagram ----------
  posts(onlyVisible = true, limit = 24) {
    return this.db.query.instagramPosts.findMany({
      where: onlyVisible ? eq(instagramPosts.visible, true) : undefined,
      orderBy: [desc(instagramPosts.featured), desc(instagramPosts.postedAt)],
      limit,
      with: { cover: { columns: mediaColumns } },
    });
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const [row] = await this.db.update(instagramPosts).set(dto).where(eq(instagramPosts.id, id)).returning();
    if (!row) throw new NotFoundException('Publicación no encontrada');
    return row;
  }
}
