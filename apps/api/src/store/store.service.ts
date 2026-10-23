import { Injectable } from '@nestjs/common';
import { asc, count, eq, gte } from 'drizzle-orm';
import { nowInStoreTz, toMinutes } from '../common/utils/time';
import { Database, InjectDb } from '../db/db.module';
import { insuranceProviders, openingHours, products, Season, settings, specialDays } from '../db/schema';

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
  [key: string]: unknown;
}

export interface SeasonConfig {
  mode: 'AUTO' | 'REGULAR' | 'SUMMER';
  summerStart: string;
  summerEnd: string;
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Injectable()
export class StoreService {
  constructor(@InjectDb() private readonly db: Database) {}

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const row = await this.db.query.settings.findFirst({ where: eq(settings.key, key) });
    return (row?.value as T) ?? fallback;
  }

  async setSetting(key: string, value: unknown) {
    const [row] = await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
      .returning();
    return row;
  }

  async allSettings() {
    const rows = await this.db.select().from(settings).orderBy(asc(settings.key));
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  seasonConfig(): Promise<SeasonConfig> {
    return this.getSetting<SeasonConfig>('season', { mode: 'AUTO', summerStart: '12-15', summerEnd: '03-15' });
  }

  /** Temporada vigente: verano en la costa (horario extendido) o resto del año */
  async currentSeason(date = new Date()): Promise<Season> {
    const cfg = await this.seasonConfig();
    if (cfg.mode !== 'AUTO') return cfg.mode;
    const { month, day } = nowInStoreTz(date);
    const md = month * 100 + day;
    const [sm, sd] = cfg.summerStart.split('-').map(Number);
    const [em, ed] = cfg.summerEnd.split('-').map(Number);
    const start = sm * 100 + sd;
    const end = em * 100 + ed;
    const inSummer = start <= end ? md >= start && md <= end : md >= start || md <= end;
    return inSummer ? 'SUMMER' : 'REGULAR';
  }

  /** Estado "abierto ahora", próximos horarios y grilla semanal */
  async status(date = new Date()) {
    const season = await this.currentSeason(date);
    const now = nowInStoreTz(date);
    const [slots, special] = await Promise.all([
      this.db.select().from(openingHours).orderBy(asc(openingHours.season), asc(openingHours.weekday), asc(openingHours.opens)),
      this.db.select().from(specialDays).where(gte(specialDays.date, now.ymd)).orderBy(asc(specialDays.date)).limit(10),
    ]);

    const seasonSlots = slots.filter((s) => s.season === season);
    const todaySpecial = special.find((s) => s.date === now.ymd);
    let today = seasonSlots.filter((s) => s.weekday === now.weekday).map((s) => ({ opens: s.opens, closes: s.closes }));
    if (todaySpecial) {
      today = todaySpecial.closed ? [] : todaySpecial.opens && todaySpecial.closes ? [{ opens: todaySpecial.opens, closes: todaySpecial.closes }] : today;
    }

    const current = today.find((s) => now.minutes >= toMinutes(s.opens) && now.minutes < toMinutes(s.closes));
    const nextToday = today.find((s) => toMinutes(s.opens) > now.minutes);

    let next: { weekday: number; dayLabel: string; opens: string } | null = null;
    if (!current) {
      if (nextToday) next = { weekday: now.weekday, dayLabel: 'Hoy', opens: nextToday.opens };
      else {
        for (let i = 1; i <= 7; i++) {
          const wd = (now.weekday + i) % 7;
          const first = seasonSlots.find((s) => s.weekday === wd);
          if (first) {
            next = { weekday: wd, dayLabel: i === 1 ? 'Mañana' : WEEKDAYS[wd], opens: first.opens };
            break;
          }
        }
      }
    }

    const closesInMinutes = current ? toMinutes(current.closes) - now.minutes : null;
    const week = (s: Season) =>
      [1, 2, 3, 4, 5, 6, 0].map((wd) => ({
        weekday: wd,
        label: WEEKDAYS[wd],
        ranges: slots.filter((x) => x.season === s && x.weekday === wd).map((x) => ({ opens: x.opens, closes: x.closes })),
      }));

    return {
      season,
      weekday: now.weekday,
      isOpen: !!current,
      closesAt: current?.closes ?? null,
      closingSoon: closesInMinutes !== null && closesInMinutes <= 30,
      next,
      today,
      todaySpecial: todaySpecial ? { label: todaySpecial.label, closed: todaySpecial.closed } : null,
      upcomingSpecialDays: special,
      weeks: { REGULAR: week('REGULAR'), SUMMER: week('SUMMER') },
    };
  }

  async publicStore() {
    const [info, hours, [ins], [prods]] = await Promise.all([
      this.getSetting<StoreInfo | null>('store', null),
      this.status(),
      this.db.select({ n: count() }).from(insuranceProviders).where(eq(insuranceProviders.active, true)),
      this.db.select({ n: count() }).from(products).where(eq(products.active, true)),
    ]);
    return { info, hours, stats: { insurers: ins.n, products: prods.n } };
  }

  // ---------- Admin ----------
  hoursAll() {
    return this.db.select().from(openingHours).orderBy(asc(openingHours.season), asc(openingHours.weekday), asc(openingHours.opens));
  }

  async replaceHours(slots: { season: Season; weekday: number; opens: string; closes: string }[]) {
    await this.db.transaction(async (tx) => {
      await tx.delete(openingHours);
      if (slots.length) await tx.insert(openingHours).values(slots);
    });
    return this.hoursAll();
  }

  specialDaysAll() {
    return this.db.select().from(specialDays).orderBy(asc(specialDays.date));
  }

  async createSpecialDay(data: { date: string; label: string; closed?: boolean; opens?: string; closes?: string }) {
    const [row] = await this.db.insert(specialDays).values({ ...data, date: data.date.slice(0, 10) }).returning();
    return row;
  }

  async removeSpecialDay(id: string) {
    await this.db.delete(specialDays).where(eq(specialDays.id, id));
    return { ok: true };
  }
}
