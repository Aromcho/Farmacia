import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { Database, InjectDb } from '../db/db.module';
import { inquiries, instagramPosts, orders, OrderStatus } from '../db/schema';
import { InternalGuard } from './internal.guard';
import { UpcomingItem, baDay, baLocal, bump, emptySeries, parseLimit, parseRange, sortUpcoming, totalsOf } from './internal.util';

/**
 * Módulo /internal de la Farmacia (panel central). Solo lectura.
 * Contrato: GET /api/internal/health · /api/internal/metrics?desde=&hasta= · /api/internal/upcoming?limite=
 * Contrato completo y cómo sumar un proyecto: README del repo panel-dios.
 *
 * Es una farmacia: hacia el panel salen cantidades, estados y códigos de pedido, nunca el nombre
 * del cliente, lo que pidió ni el texto de una consulta.
 */
const SERVICE = 'farmacia';
const { version } = require('../../package.json') as { version: string };

/** Contadores de la serie diaria. «ingresos» es la suma en pesos de los pedidos no cancelados. */
const COUNTERS = ['pedidos', 'pedidosEntregados', 'ingresos', 'consultas', 'posts'] as const;
/** Qué contadores propios alimentan cada contador común del panel */
const COMMON = { publicaciones: ['posts'], consultas: ['consultas'], ventas: ['pedidos'], visitas: [] };
const OPEN: OrderStatus[] = ['NEW', 'CONTACTED', 'PREPARING', 'READY'];
const STATUS_LABEL: Record<string, string> = { NEW: 'nuevo', CONTACTED: 'contactado', PREPARING: 'en preparación', READY: 'listo para entregar' };

@Injectable()
class InternalService {
  constructor(@InjectDb() private readonly db: Database) {}

  async health() {
    let db: 'up' | 'down' = 'up';
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch {
      db = 'down';
    }
    return { ok: db === 'up', service: SERVICE, version, uptime: Math.round(process.uptime()), db, now: new Date().toISOString() };
  }

  async metrics(query: Record<string, unknown>) {
    const range = parseRange(query);
    const [creados, entregados, consultas, posts] = await Promise.all([
      this.db
        .select({ createdAt: orders.createdAt, status: orders.status, total: orders.total, channel: orders.channel })
        .from(orders)
        .where(and(gte(orders.createdAt, range.from), lt(orders.createdAt, range.to))),
      // No hay fecha de entrega: se toma la última modificación del pedido entregado
      this.db
        .select({ updatedAt: orders.updatedAt })
        .from(orders)
        .where(and(eq(orders.status, 'DELIVERED'), gte(orders.updatedAt, range.from), lt(orders.updatedAt, range.to))),
      this.db
        .select({ createdAt: inquiries.createdAt })
        .from(inquiries)
        .where(and(gte(inquiries.createdAt, range.from), lt(inquiries.createdAt, range.to))),
      this.db
        .select({ postedAt: instagramPosts.postedAt })
        .from(instagramPosts)
        .where(and(gte(instagramPosts.postedAt, range.from), lt(instagramPosts.postedAt, range.to))),
    ]);

    const series = emptySeries(range, COUNTERS);
    const pedidosPorEstado: Record<string, number> = {};
    const pedidosPorCanal: Record<string, number> = {};
    let pedidosCancelados = 0;
    for (const o of creados) {
      pedidosPorEstado[o.status] = (pedidosPorEstado[o.status] ?? 0) + 1;
      if (o.status === 'CANCELLED') {
        pedidosCancelados += 1;
        continue;
      }
      const day = baDay(o.createdAt);
      bump(series, day, 'pedidos');
      bump(series, day, 'ingresos', o.total ?? 0);
      pedidosPorCanal[o.channel] = (pedidosPorCanal[o.channel] ?? 0) + 1;
    }
    entregados.forEach((o) => bump(series, baDay(o.updatedAt), 'pedidosEntregados'));
    consultas.forEach((c) => bump(series, baDay(c.createdAt), 'consultas'));
    posts.forEach((p) => p.postedAt && bump(series, baDay(p.postedAt), 'posts'));

    return {
      service: SERVICE,
      desde: range.desde,
      hasta: range.hasta,
      totals: { ...totalsOf(series, COUNTERS), pedidosPorEstado, pedidosPorCanal, pedidosCancelados },
      common: COMMON,
      series: [...series.values()],
      byProperty: [],
    };
  }

  /** La farmacia no agenda nada a futuro: lo que hay son pendientes (pedidos abiertos y consultas sin atender) */
  async upcoming(query: Record<string, unknown>) {
    const limite = parseLimit(query);
    const [abiertos, sinAtender] = await Promise.all([
      this.db
        .select({ code: orders.code, status: orders.status, createdAt: orders.createdAt })
        .from(orders)
        .where(inArray(orders.status, OPEN))
        .orderBy(asc(orders.createdAt))
        .limit(limite),
      this.db
        .select({ n: sql<number>`count(*)::int`, first: sql<Date | null>`min(${inquiries.createdAt})` })
        .from(inquiries)
        .where(eq(inquiries.handled, false)),
    ]);

    const items: UpcomingItem[] = abiertos.map((o) => ({
      kind: 'pedido',
      title: `Pedido ${o.code}`,
      date: baLocal(o.createdAt),
      pending: true,
      who: '',
      status: STATUS_LABEL[o.status] ?? o.status,
      propertyId: null,
      ref: o.code,
    }));
    const pendientes = sinAtender[0]?.n ?? 0;
    if (pendientes) {
      items.push({
        kind: 'consulta',
        title: `${pendientes} ${pendientes === 1 ? 'consulta sin atender' : 'consultas sin atender'}`,
        date: baLocal(sinAtender[0].first ? new Date(sinAtender[0].first) : new Date()),
        pending: true,
        who: '',
        status: '',
        propertyId: null,
        ref: 'consultas',
      });
    }
    return { service: SERVICE, generatedAt: new Date().toISOString(), items: sortUpcoming(items) };
  }
}

@ApiExcludeController()
@SkipThrottle()
@Controller('internal')
@UseGuards(InternalGuard)
class InternalController {
  constructor(private readonly internal: InternalService) {}

  @Get('health')
  health() {
    return this.internal.health();
  }

  @Get('metrics')
  metrics(@Query() query: Record<string, unknown>) {
    return this.internal.metrics(query);
  }

  @Get('upcoming')
  upcoming(@Query() query: Record<string, unknown>) {
    return this.internal.upcoming(query);
  }
}

@Module({ controllers: [InternalController], providers: [InternalService, InternalGuard] })
export class InternalModule {}
