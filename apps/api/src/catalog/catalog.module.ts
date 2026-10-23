import { Module } from '@nestjs/common';
import { CatalogAdminController, CatalogController } from './catalog.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [CatalogController, CatalogAdminController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService],
})
export class CatalogModule {}
