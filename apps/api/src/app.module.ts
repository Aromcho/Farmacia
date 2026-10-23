import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';
import { ContentModule } from './content/content.module';
import { HealthController } from './health.controller';
import { MediaModule } from './media/media.module';
import { OrdersModule } from './orders/orders.module';
import { DbModule } from './db/db.module';
import { StatsModule } from './stats/stats.module';
import { StoreModule } from './store/store.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 240 }]),
    DbModule,
    AuthModule,
    UsersModule,
    MediaModule,
    StoreModule,
    CatalogModule,
    ContentModule,
    OrdersModule,
    StatsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PgExceptionFilter },
  ],
})
export class AppModule {}
