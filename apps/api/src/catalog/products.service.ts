import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNotNull, ne, or, SQL, sql } from 'drizzle-orm';
import { mediaColumns } from '../common/media';
import { paginate } from '../common/utils/pagination';
import { arrayFuzzyContains, fuzzyContains } from '../common/utils/search';
import { uniqueSlug } from '../common/utils/slug';
import { Database, InjectDb } from '../db/db.module';
import { brands, categories, productImages, products } from '../db/schema';
import { AdminProductQueryDto, ProductQueryDto, UpsertProductDto } from './dto/product.dto';

type OrderSpec = SQL[];

@Injectable()
export class ProductsService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** Consulta de "tarjetas" de producto con marca, categoría y 2 imágenes */
  findCards(where: SQL | undefined, orderBy: OrderSpec, limit: number, offset = 0) {
    return this.db.query.products.findMany({
      where,
      orderBy,
      limit,
      offset,
      with: {
        brand: { columns: { id: true, name: true, slug: true } },
        category: { columns: { id: true, name: true, slug: true, accent: true } },
        images: {
          orderBy: (pi, { asc: a }) => [a(pi.sortOrder)],
          limit: 2,
          with: { media: { columns: mediaColumns } },
        },
      },
    });
  }

  private buildWhere(q: ProductQueryDto, onlyActive: boolean, status?: string): SQL | undefined {
    const conds: SQL[] = [];
    if (onlyActive || status === 'active') conds.push(eq(products.active, true));
    if (status === 'inactive') conds.push(eq(products.active, false));

    if (q.category) {
      const catIds = this.db.select({ id: categories.id }).from(categories).where(eq(categories.slug, q.category));
      const childIds = this.db.select({ id: categories.id }).from(categories).where(inArray(categories.parentId, catIds));
      conds.push(or(inArray(products.categoryId, catIds), inArray(products.categoryId, childIds))!);
    }
    if (q.brand) {
      conds.push(inArray(products.brandId, this.db.select({ id: brands.id }).from(brands).where(eq(brands.slug, q.brand))));
    }
    if (q.tag) conds.push(sql`${products.tags} @> ARRAY[${q.tag}]::text[]`);
    if (q.gender) conds.push(eq(products.gender, q.gender));
    if (q.featured === 'true') conds.push(eq(products.featured, true));
    if (q.isNew === 'true') conds.push(eq(products.isNew, true));
    if (q.decant === 'true') conds.push(eq(products.hasDecant, true));
    if (q.promo === 'true') conds.push(or(isNotNull(products.compareAtPrice), sql`${products.cashPrice} < ${products.price}`)!);

    const terms = (q.q ?? '').trim().split(/\s+/).filter((t) => t.length > 1).slice(0, 5);
    for (const term of terms) {
      conds.push(
        or(
          fuzzyContains(products.name, term),
          fuzzyContains(products.presentation, term),
          fuzzyContains(products.shortDescription, term),
          inArray(products.brandId, this.db.select({ id: brands.id }).from(brands).where(fuzzyContains(brands.name, term))),
          inArray(products.categoryId, this.db.select({ id: categories.id }).from(categories).where(fuzzyContains(categories.name, term))),
          arrayFuzzyContains([products.tags, products.notesTop, products.notesHeart, products.notesBase, products.highlights], term),
        )!,
      );
    }
    return conds.length ? and(...conds) : undefined;
  }

  private buildOrder(sort?: string): OrderSpec {
    switch (sort) {
      case 'new':
        return [desc(products.isNew), desc(products.createdAt)];
      case 'price-asc':
        return [sql`${products.price} asc nulls last`];
      case 'price-desc':
        return [sql`${products.price} desc nulls last`];
      case 'name':
        return [asc(products.name)];
      case 'popular':
        return [desc(products.views), desc(products.featured)];
      default:
        return [desc(products.featured), asc(products.sortOrder), desc(products.isNew), desc(products.createdAt)];
    }
  }

  private async total(where: SQL | undefined) {
    const [{ value }] = await this.db.select({ value: count() }).from(products).where(where);
    return value;
  }

  async list(q: ProductQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 24, 100);
    const where = this.buildWhere(q, true);
    const [items, total] = await Promise.all([
      this.findCards(where, this.buildOrder(q.sort), pageSize, (page - 1) * pageSize),
      this.total(where),
    ]);
    return paginate(items, total, page, pageSize);
  }

  async listAdmin(q: AdminProductQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 30;
    const where = this.buildWhere(q, false, q.status);
    const order = q.sort ? this.buildOrder(q.sort) : [desc(products.updatedAt)];
    const [items, total] = await Promise.all([this.findCards(where, order, pageSize, (page - 1) * pageSize), this.total(where)]);
    return paginate(items, total, page, pageSize);
  }

  async bySlug(slug: string) {
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.active, true)),
      with: {
        brand: { columns: { id: true, name: true, slug: true, origin: true } },
        category: { columns: { id: true, name: true, slug: true, accent: true }, with: { parent: { columns: { name: true, slug: true } } } },
        images: { orderBy: (pi, { asc: a }) => [a(pi.sortOrder)], with: { media: { columns: mediaColumns } } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const relatedWhere = and(
      eq(products.active, true),
      ne(products.id, product.id),
      product.brandId ? or(eq(products.categoryId, product.categoryId), eq(products.brandId, product.brandId)) : eq(products.categoryId, product.categoryId),
    );
    const related = await this.findCards(relatedWhere, [desc(products.featured), desc(products.views)], 8);
    return { ...product, related };
  }

  async byId(id: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        brand: true,
        category: true,
        images: { orderBy: (pi, { asc: a }) => [a(pi.sortOrder)], with: { media: { columns: mediaColumns } } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async registerView(slug: string) {
    await this.db
      .update(products)
      .set({ views: sql`${products.views} + 1`, updatedAt: sql`${products.updatedAt}` })
      .where(eq(products.slug, slug));
  }

  private async slugFor(base: string, excludeId?: string) {
    return uniqueSlug(base, async (s) => {
      const hit = await this.db.query.products.findFirst({ where: eq(products.slug, s), columns: { id: true } });
      return !!hit && hit.id !== excludeId;
    });
  }

  async create(dto: UpsertProductDto) {
    const { imageIds, slug, ...data } = dto;
    const finalSlug = await this.slugFor(slug || [dto.name, dto.presentation].filter(Boolean).join(' '));
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(products).values({ ...data, slug: finalSlug }).returning({ id: products.id });
      if (imageIds?.length) {
        await tx.insert(productImages).values(imageIds.map((mediaId, i) => ({ productId: row.id, mediaId, sortOrder: i })));
      }
      return row.id;
    });
    return this.byId(id);
  }

  async update(id: string, dto: Partial<UpsertProductDto>) {
    const { imageIds, slug, ...data } = dto;
    const nextSlug = slug ? await this.slugFor(slug, id) : undefined;
    await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(products)
        .set({ ...data, ...(nextSlug ? { slug: nextSlug } : {}) })
        .where(eq(products.id, id))
        .returning({ id: products.id });
      if (!row) throw new NotFoundException('Producto no encontrado');
      if (imageIds) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        if (imageIds.length) {
          await tx.insert(productImages).values(imageIds.map((mediaId, i) => ({ productId: id, mediaId, sortOrder: i })));
        }
      }
    });
    return this.byId(id);
  }

  async remove(id: string) {
    await this.db.delete(products).where(eq(products.id, id));
    return { ok: true };
  }

  async bulk(ids: string[], action: string) {
    if (!ids.length) return { count: 0 };
    if (action === 'delete') {
      const rows = await this.db.delete(products).where(inArray(products.id, ids)).returning({ id: products.id });
      return { count: rows.length };
    }
    const map: Record<string, Partial<typeof products.$inferInsert>> = {
      activate: { active: true },
      deactivate: { active: false },
      feature: { featured: true },
      unfeature: { featured: false },
      available: { available: true },
      unavailable: { available: false },
    };
    const rows = await this.db.update(products).set(map[action]).where(inArray(products.id, ids)).returning({ id: products.id });
    return { count: rows.length };
  }

  /** Facetas para los filtros del catálogo */
  async facets() {
    const [brandRows, categoryRows, tagRows] = await Promise.all([
      this.db
        .select({ name: brands.name, slug: brands.slug, count: count(products.id) })
        .from(brands)
        .innerJoin(products, and(eq(products.brandId, brands.id), eq(products.active, true)))
        .groupBy(brands.id)
        .orderBy(asc(brands.name)),
      this.db
        .select({ name: categories.name, slug: categories.slug, icon: categories.icon, count: count(products.id) })
        .from(categories)
        .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.active, true)))
        .where(eq(categories.active, true))
        .groupBy(categories.id)
        .orderBy(asc(categories.sortOrder)),
      this.db.execute<{ tag: string; n: number }>(
        sql`SELECT tag, COUNT(*)::int AS n FROM (SELECT unnest(tags) AS tag FROM products WHERE active) t GROUP BY tag ORDER BY n DESC, tag LIMIT 30`,
      ),
    ]);
    return {
      brands: brandRows,
      categories: categoryRows,
      tags: tagRows.rows.map((r) => ({ tag: r.tag, count: Number(r.n) })),
    };
  }
}
