import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { StatsController } from './stats.controller';

@Module({ imports: [CatalogModule], controllers: [StatsController] })
export class StatsModule {}
