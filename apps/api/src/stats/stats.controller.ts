import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { ProductsService } from '../catalog/products.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { Database, InjectDb } from '../db/db.module';
import { brands, categories, inquiries, orders, products } from '../db/schema';
import { StoreService } from '../store/store.service';

@ApiTags('admin / dashboard')
@Controller('admin/stats')
@UseGuards(AdminGuard)
export class StatsController {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly store: StoreService,
    private readonly products: ProductsService,
  ) {}

  @Get()
  async dashboard() {
    const since7 = new Date(Date.now() - 7 * 864e5);
    const since30 = new Date(Date.now() - 30 * 864e5);
    const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
    const [totalProducts, activeProducts, featured, cats, brandCount, ordersNew, orders7, orders30, inquiriesPending, topViewed, recentOrders, byStatus, daily, hours] =
      await Promise.all([
        n(this.db.select({ n: count() }).from(products)),
        n(this.db.select({ n: count() }).from(products).where(eq(products.active, true))),
        n(this.db.select({ n: count() }).from(products).where(and(eq(products.featured, true), eq(products.active, true)))),
        n(this.db.select({ n: count() }).from(categories)),
        n(this.db.select({ n: count() }).from(brands)),
        n(this.db.select({ n: count() }).from(orders).where(eq(orders.status, 'NEW'))),
        n(this.db.select({ n: count() }).from(orders).where(gte(orders.createdAt, since7))),
        n(this.db.select({ n: count() }).from(orders).where(gte(orders.createdAt, since30))),
        n(this.db.select({ n: count() }).from(inquiries).where(eq(inquiries.handled, false))),
        this.products.findCards(eq(products.active, true), [desc(products.views)], 6),
        this.db.query.orders.findMany({ orderBy: [desc(orders.createdAt)], limit: 6, with: { items: true } }),
        this.db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
        this.db.execute<{ day: string; n: number }>(
          sql`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS n FROM orders WHERE created_at >= ${since30} GROUP BY 1 ORDER BY 1`,
        ),
        this.store.status(),
      ]);
    return {
      totals: { products: totalProducts, activeProducts, featured, categories: cats, brands: brandCount, ordersNew, orders7, orders30, inquiriesPending },
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.n])),
      daily: daily.rows.map((d) => ({ day: d.day, count: Number(d.n) })),
      topViewed,
      recentOrders,
      hours: { isOpen: hours.isOpen, season: hours.season, closesAt: hours.closesAt, next: hours.next },
    };
  }
}
