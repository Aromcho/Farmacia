import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../common/guards/admin.guard';
import { paginate } from '../common/utils/pagination';
import type { MediaKind } from '../db/schema';
import { MediaService } from './media.service';

@ApiTags('admin / media')
@Controller('admin/media')
@UseGuards(AdminGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  async list(@Query('page') page = '1', @Query('pageSize') pageSize = '48', @Query('kind') kind?: MediaKind, @Query('q') q?: string) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.min(120, Math.max(1, Number(pageSize) || 48));
    const { items, total } = await this.media.list({ page: p, pageSize: ps, kind: kind === 'IMAGE' || kind === 'VIDEO' ? kind : undefined, q });
    return paginate(items, total, p, ps);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, alt: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } }))
  upload(@UploadedFile(new ParseFilePipeBuilder().build({ fileIsRequired: true })) file: Express.Multer.File, @Body('alt') alt?: string) {
    return this.media.upload(file, alt);
  }

  @Patch(':id')
  updateAlt(@Param('id', ParseUUIDPipe) id: string, @Body('alt') alt: string) {
    return this.media.updateAlt(id, alt ?? '');
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.remove(id);
  }
}
