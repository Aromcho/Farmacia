import { Module } from '@nestjs/common';
import { ContentAdminController, ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [ContentController, ContentAdminController],
  providers: [ContentService],
})
export class ContentModule {}
