import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { bannerPlacementEnum, type BannerPlacement } from '../db/schema';
import { ReorderDto } from '../catalog/dto/category.dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { ContentService } from './content.service';
import { UpdateBannerDto, UpdateHighlightDto, UpdateInsurerDto, UpdatePostDto, UpsertBannerDto, UpsertHighlightDto, UpsertInsurerDto } from './dto/content.dto';

@ApiTags('contenido')
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('highlights')
  highlights() {
    return this.content.highlights(true);
  }

  @Get('banners')
  banners(@Query('placement') placement?: BannerPlacement) {
    const valid = placement && bannerPlacementEnum.enumValues.includes(placement) ? placement : undefined;
    return this.content.banners(valid, true);
  }

  @Get('insurers')
  insurers() {
    return this.content.insurers(true);
  }

  @Get('instagram')
  posts(@Query('limit') limit = '12') {
    return this.content.posts(true, Math.min(48, Math.max(1, Number(limit) || 12)));
  }
}

@ApiTags('admin / contenido')
@Controller('admin')
@UseGuards(AdminGuard)
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Get('highlights')
  highlights() {
    return this.content.highlights(false);
  }

  @Post('highlights')
  createHighlight(@Body() dto: UpsertHighlightDto) {
    return this.content.createHighlight(dto);
  }

  @Patch('highlights/:id')
  updateHighlight(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHighlightDto) {
    return this.content.updateHighlight(id, dto);
  }

  @Delete('highlights/:id')
  removeHighlight(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeHighlight(id);
  }

  @Post('highlights/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.content.reorderHighlights(dto.ids);
  }

  @Get('banners')
  banners() {
    return this.content.banners(undefined, false);
  }

  @Post('banners')
  createBanner(@Body() dto: UpsertBannerDto) {
    return this.content.createBanner(dto);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto) {
    return this.content.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  removeBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeBanner(id);
  }

  @Get('insurers')
  insurers() {
    return this.content.insurers(false);
  }

  @Post('insurers')
  createInsurer(@Body() dto: UpsertInsurerDto) {
    return this.content.createInsurer(dto);
  }

  @Patch('insurers/:id')
  updateInsurer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInsurerDto) {
    return this.content.updateInsurer(id, dto);
  }

  @Delete('insurers/:id')
  removeInsurer(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeInsurer(id);
  }

  @Get('instagram')
  posts() {
    return this.content.posts(false, 200);
  }

  @Patch('instagram/:id')
  updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.content.updatePost(id, dto);
  }
}
