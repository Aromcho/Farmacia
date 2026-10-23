import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, count, desc, eq, or, SQL } from 'drizzle-orm';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { fuzzyContains } from '../common/utils/search';
import { Database, InjectDb } from '../db/db.module';
import { media, MediaKind } from '../db/schema';
import { processImage, storeVideo } from './image-pipeline';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic', 'image/heif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

@Injectable()
export class MediaService {
  readonly uploadsDir: string;

  constructor(
    @InjectDb() private readonly db: Database,
    config: ConfigService,
  ) {
    this.uploadsDir = resolve(config.get<string>('UPLOADS_DIR') ?? './uploads');
  }

  async upload(file: Express.Multer.File, alt?: string, source = 'upload') {
    if (!file) throw new BadRequestException('Falta el archivo');
    if (IMAGE_TYPES.includes(file.mimetype)) {
      const img = await processImage(file.buffer, this.uploadsDir);
      const [row] = await this.db.insert(media).values({ kind: 'IMAGE', ...img, alt, source }).returning();
      return row;
    }
    if (VIDEO_TYPES.includes(file.mimetype)) {
      const ext = file.mimetype === 'video/webm' ? 'webm' : file.mimetype === 'video/quicktime' ? 'mov' : 'mp4';
      const vid = await storeVideo(file.buffer, this.uploadsDir, ext);
      const [row] = await this.db.insert(media).values({ kind: 'VIDEO', ...vid, alt, source }).returning();
      return row;
    }
    throw new BadRequestException('Formato no soportado. Usá JPG, PNG, WebP, AVIF, MP4 o WebM.');
  }

  async list(params: { page: number; pageSize: number; kind?: MediaKind; q?: string }) {
    const conds: SQL[] = [];
    if (params.kind) conds.push(eq(media.kind, params.kind));
    if (params.q) conds.push(or(fuzzyContains(media.alt, params.q), fuzzyContains(media.source, params.q))!);
    const where = conds.length ? and(...conds) : undefined;
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(media)
        .where(where)
        .orderBy(desc(media.createdAt))
        .limit(params.pageSize)
        .offset((params.page - 1) * params.pageSize),
      this.db.select({ total: count() }).from(media).where(where),
    ]);
    return { items, total };
  }

  async updateAlt(id: string, alt: string) {
    const [row] = await this.db.update(media).set({ alt }).where(eq(media.id, id)).returning();
    if (!row) throw new NotFoundException('Archivo no encontrado');
    return row;
  }

  async remove(id: string) {
    const row = await this.db.query.media.findFirst({ where: eq(media.id, id) });
    if (!row) throw new NotFoundException('Archivo no encontrado');
    await this.db.delete(media).where(eq(media.id, id));
    const files = new Set<string>([row.path, ...Object.values(row.variants ?? {})]);
    await Promise.all([...files].map((p) => fs.unlink(join(this.uploadsDir, p)).catch(() => undefined)));
    return { ok: true };
  }
}
