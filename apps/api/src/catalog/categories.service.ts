import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import { mediaColumns } from '../common/media';
import { uniqueSlug } from '../common/utils/slug';
import { Database, InjectDb } from '../db/db.module';
import { brands, categories, products } from '../db/schema';
import { UpsertBrandDto, UpsertCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectDb() private readonly db: Database) {}

  private async productCounts(by: 'category' | 'brand', onlyActive: boolean) {
    const col = by === 'category' ? products.categoryId : products.brandId;
    const rows = await this.db
      .select({ id: col, n: count() })
      .from(products)
      .where(onlyActive ? eq(products.active, true) : undefined)
      .groupBy(col);
    return new Map(rows.map((r) => [r.id, r.n]));
  }

  async listPublic() {
    const [rows, counts] = await Promise.all([
      this.db.query.categories.findMany({
        where: eq(categories.active, true),
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
        with: { cover: { columns: mediaColumns } },
      }),
      this.productCounts('category', true),
    ]);
    return rows.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
  }

  async listAdmin() {
    const [rows, counts] = await Promise.all([
      this.db.query.categories.findMany({
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
        with: { cover: { columns: mediaColumns } },
      }),
      this.productCounts('category', false),
    ]);
    return rows.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
  }

  async bySlug(slug: string) {
    const row = await this.db.query.categories.findFirst({
      where: and(eq(categories.slug, slug), eq(categories.active, true)),
      with: { cover: { columns: mediaColumns }, children: { columns: { id: true, name: true, slug: true } } },
    });
    if (!row) throw new NotFoundException('Categoría no encontrada');
    return row;
  }

  private slugFor(table: 'categories' | 'brands', base: string, excludeId?: string) {
    return uniqueSlug(base, async (s) => {
      const hit =
        table === 'categories'
          ? await this.db.query.categories.findFirst({ where: eq(categories.slug, s), columns: { id: true } })
          : await this.db.query.brands.findFirst({ where: eq(brands.slug, s), columns: { id: true } });
      return !!hit && hit.id !== excludeId;
    });
  }

  async create(dto: UpsertCategoryDto) {
    const slug = await this.slugFor('categories', dto.slug || dto.name);
    const [row] = await this.db.insert(categories).values({ ...dto, slug }).returning();
    return row;
  }

  async update(id: string, dto: Partial<UpsertCategoryDto>) {
    const data = { ...dto };
    if (dto.slug) data.slug = await this.slugFor('categories', dto.slug, id);
    const [row] = await this.db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!row) throw new NotFoundException('Categoría no encontrada');
    return row;
  }

  async remove(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id));
    return { ok: true };
  }

  async reorder(ids: string[]) {
    await this.db.transaction(async (tx) => {
      for (const [i, id] of ids.entries()) await tx.update(categories).set({ sortOrder: i }).where(eq(categories.id, id));
    });
    return { ok: true };
  }

  // ---- Marcas ----
  async listBrands() {
    const [rows, counts] = await Promise.all([
      this.db.query.brands.findMany({ orderBy: [asc(brands.name)], with: { logo: { columns: mediaColumns } } }),
      this.productCounts('brand', true),
    ]);
    return rows.map((b) => ({ ...b, productCount: counts.get(b.id) ?? 0 }));
  }

  async createBrand(dto: UpsertBrandDto) {
    const slug = await this.slugFor('brands', dto.slug || dto.name);
    const [row] = await this.db.insert(brands).values({ ...dto, slug }).returning();
    return row;
  }

  async updateBrand(id: string, dto: Partial<UpsertBrandDto>) {
    const data = { ...dto };
    if (dto.slug) data.slug = await this.slugFor('brands', dto.slug, id);
    const [row] = await this.db.update(brands).set(data).where(eq(brands.id, id)).returning();
    if (!row) throw new NotFoundException('Marca no encontrada');
    return row;
  }

  async removeBrand(id: string) {
    await this.db.delete(brands).where(eq(brands.id, id));
    return { ok: true };
  }
}
