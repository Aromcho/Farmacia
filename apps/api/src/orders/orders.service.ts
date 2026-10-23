import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, or, SQL } from 'drizzle-orm';
import { paginate } from '../common/utils/pagination';
import { Database, InjectDb } from '../db/db.module';
import { inquiries, orderItems, orders, products } from '../db/schema';
import { StoreService } from '../store/store.service';
import { CreateInquiryDto, CreateOrderDto, OrderQueryDto, UpdateOrderDto } from './dto/order.dto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const PAYMENT_LABEL = { CASH: 'efectivo', CARD: 'tarjeta', TRANSFER: 'transferencia', OTHER: 'otro' } as const;

@Injectable()
export class OrdersService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly store: StoreService,
  ) {}

  private code() {
    let s = 'AF-';
    for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return s;
  }

  /** Registra el pedido (con "foto" de nombres y precios) y arma el mensaje de WhatsApp */
  async create(dto: CreateOrderDto) {
    if (dto.website) throw new BadRequestException('Solicitud inválida');
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const found = await this.db.query.products.findMany({
      where: and(inArray(products.id, ids), eq(products.active, true)),
      with: { brand: { columns: { name: true } } },
    });
    if (!found.length) throw new BadRequestException('Los productos del pedido ya no están disponibles');
    const byId = new Map(found.map((p) => [p.id, p]));

    const items = dto.items
      .filter((i) => byId.has(i.productId))
      .map((i) => {
        const p = byId.get(i.productId)!;
        return {
          productId: p.id,
          name: [p.brand?.name, p.name, p.presentation].filter(Boolean).join(' · '),
          unitPrice: p.showPrice ? (p.price ?? null) : null,
          quantity: i.quantity,
          option: i.option ?? null,
        };
      });
    const total = items.every((i) => i.unitPrice !== null) ? items.reduce((acc, i) => acc + (i.unitPrice ?? 0) * i.quantity, 0) : null;

    let code = this.code();
    while (await this.db.query.orders.findFirst({ where: eq(orders.code, code), columns: { id: true } })) code = this.code();

    const order = await this.db.transaction(async (tx) => {
      const [o] = await tx
        .insert(orders)
        .values({
          code,
          customerName: dto.customerName.trim(),
          phone: dto.phone.trim(),
          email: dto.email,
          address: dto.address,
          deliveryMethod: dto.deliveryMethod ?? 'PICKUP',
          paymentMethod: dto.paymentMethod,
          insurance: dto.insurance,
          notes: dto.notes,
          total,
        })
        .returning();
      const its = await tx
        .insert(orderItems)
        .values(items.map((i) => ({ ...i, orderId: o.id })))
        .returning();
      return { ...o, items: its };
    });

    const info = await this.store.getSetting<{ whatsapp?: string } | null>('store', null);
    const lines = [
      `¡Hola! Quiero hacer un pedido 🛍️ *${order.code}*`,
      '',
      ...order.items.map((i) => `• ${i.quantity} × ${i.name}${i.option ? ` (${i.option})` : ''}${i.unitPrice ? ` — ${money(i.unitPrice)}` : ''}`),
      '',
      total !== null ? `Total de lista: ${money(total)}` : 'Total: a confirmar',
      `Entrega: ${order.deliveryMethod === 'DELIVERY' ? `envío a domicilio${order.address ? ` (${order.address})` : ''}` : 'retiro en la farmacia'}`,
      order.paymentMethod ? `Pago: ${PAYMENT_LABEL[order.paymentMethod]}` : '',
      order.insurance ? `Obra social: ${order.insurance}` : '',
      order.notes ? `Nota: ${order.notes}` : '',
      '',
      `A nombre de: ${order.customerName}`,
    ].filter((l) => l !== null);
    const message = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const phone = (info?.whatsapp ?? '').replace(/\D/g, '');
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

    return { order, message, whatsappUrl };
  }

  async list(q: OrderQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 25;
    const conds: SQL[] = [];
    if (q.status) conds.push(eq(orders.status, q.status));
    if (q.q) conds.push(or(ilike(orders.code, `%${q.q}%`), ilike(orders.customerName, `%${q.q}%`), ilike(orders.phone, `%${q.q}%`))!);
    const where = conds.length ? and(...conds) : undefined;
    const [items, [{ total }]] = await Promise.all([
      this.db.query.orders.findMany({ where, orderBy: [desc(orders.createdAt)], limit: pageSize, offset: (page - 1) * pageSize, with: { items: true } }),
      this.db.select({ total: count() }).from(orders).where(where),
    ]);
    return paginate(items, total, page, pageSize);
  }

  async update(id: string, dto: UpdateOrderDto) {
    const [row] = await this.db.update(orders).set(dto).where(eq(orders.id, id)).returning({ id: orders.id });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } });
  }

  async remove(id: string) {
    await this.db.delete(orders).where(eq(orders.id, id));
    return { ok: true };
  }

  // ---- Consultas ----
  async createInquiry(dto: CreateInquiryDto) {
    if (dto.website) throw new BadRequestException('Solicitud inválida');
    const { website: _honeypot, ...data } = dto;
    const [row] = await this.db.insert(inquiries).values(data).returning({ id: inquiries.id });
    return { ok: true, id: row.id };
  }

  inquiriesList(onlyPending = false) {
    return this.db.query.inquiries.findMany({
      where: onlyPending ? eq(inquiries.handled, false) : undefined,
      orderBy: [desc(inquiries.createdAt)],
      limit: 200,
      with: { product: { columns: { name: true, slug: true } } },
    });
  }

  async updateInquiry(id: string, handled: boolean) {
    const [row] = await this.db.update(inquiries).set({ handled }).where(eq(inquiries.id, id)).returning();
    if (!row) throw new NotFoundException('Consulta no encontrada');
    return row;
  }

  async removeInquiry(id: string) {
    await this.db.delete(inquiries).where(eq(inquiries.id, id));
    return { ok: true };
  }
}
