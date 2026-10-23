import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReplaceHoursDto, SeasonConfigDto, SpecialDayDto, UpdateSettingDto } from './dto/store.dto';
import { StoreService } from './store.service';

@ApiTags('tienda')
@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  /** Datos de la farmacia + horario con estado "abierto ahora" */
  @Get()
  info() {
    return this.store.publicStore();
  }

  @Get('hours')
  hours() {
    return this.store.status();
  }
}

@ApiTags('admin / tienda')
@Controller('admin/store')
@UseGuards(AdminGuard)
export class StoreAdminController {
  constructor(private readonly store: StoreService) {}

  @Get('settings')
  settings() {
    return this.store.allSettings();
  }

  @Put('settings/:key')
  @Roles('ADMIN')
  setSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.store.setSetting(key, dto.value);
  }

  @Put('season')
  async season(@Body() dto: SeasonConfigDto) {
    const cfg = await this.store.seasonConfig();
    return this.store.setSetting('season', { ...cfg, ...dto });
  }

  @Get('hours')
  hours() {
    return this.store.hoursAll();
  }

  @Put('hours')
  replaceHours(@Body() dto: ReplaceHoursDto) {
    return this.store.replaceHours(dto.slots);
  }

  @Get('special-days')
  specialDays() {
    return this.store.specialDaysAll();
  }

  @Post('special-days')
  createSpecialDay(@Body() dto: SpecialDayDto) {
    return this.store.createSpecialDay(dto);
  }

  @Delete('special-days/:id')
  removeSpecialDay(@Param('id', ParseUUIDPipe) id: string) {
    return this.store.removeSpecialDay(id);
  }
}
