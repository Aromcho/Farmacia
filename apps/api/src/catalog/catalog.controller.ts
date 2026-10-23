import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../common/guards/admin.guard';
import { CategoriesService } from './categories.service';
import { ReorderDto, UpdateBrandDto, UpdateCategoryDto, UpsertBrandDto, UpsertCategoryDto } from './dto/category.dto';
import { AdminProductQueryDto, BulkProductDto, ProductQueryDto, UpdateProductDto, UpsertProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

/** Endpoints públicos del catálogo */
@ApiTags('catálogo')
@Controller()
export class CatalogController {
  constructor(
    private readonly products: ProductsService,
    private readonly categories: CategoriesService,
  ) {}

  @Get('categories')
  categoriesList() {
    return this.categories.listPublic();
  }

  @Get('categories/:slug')
  category(@Param('slug') slug: string) {
    return this.categories.bySlug(slug);
  }

  @Get('brands')
  brands() {
    return this.categories.listBrands();
  }

  @Get('products')
  list(@Query() q: ProductQueryDto) {
    return this.products.list(q);
  }

  @Get('products/facets')
  facets() {
    return this.products.facets();
  }

  @Get('products/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.products.bySlug(slug);
  }

  @Post('products/:slug/view')
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async view(@Param('slug') slug: string) {
    await this.products.registerView(slug);
  }
}

/** Gestión del catálogo desde el panel */
@ApiTags('admin / catálogo')
@Controller('admin')
@UseGuards(AdminGuard)
export class CatalogAdminController {
  constructor(
    private readonly products: ProductsService,
    private readonly categories: CategoriesService,
  ) {}

  // Productos
  @Get('products')
  listProducts(@Query() q: AdminProductQueryDto) {
    return this.products.listAdmin(q);
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.byId(id);
  }

  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete('products/:id')
  removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.remove(id);
  }

  @Post('products/bulk')
  bulk(@Body() dto: BulkProductDto) {
    return this.products.bulk(dto.ids, dto.action);
  }

  // Categorías
  @Get('categories')
  listCategories() {
    return this.categories.listAdmin();
  }

  @Post('categories')
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }

  @Post('categories/reorder')
  reorderCategories(@Body() dto: ReorderDto) {
    return this.categories.reorder(dto.ids);
  }

  // Marcas
  @Get('brands')
  listBrands() {
    return this.categories.listBrands();
  }

  @Post('brands')
  createBrand(@Body() dto: UpsertBrandDto) {
    return this.categories.createBrand(dto);
  }

  @Patch('brands/:id')
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.categories.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  removeBrand(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.removeBrand(id);
  }
}
