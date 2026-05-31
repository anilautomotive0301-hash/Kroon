import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  AddStockDto,
  CreateFabricItemDto,
  InventoryService,
  RecordConsumptionDto,
} from './inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('fabric')
  getFabricItems() {
    return this.inventoryService.getFabricItems();
  }

  @Post('fabric')
  createFabricItem(@Body() dto: CreateFabricItemDto) {
    return this.inventoryService.createFabricItem(dto);
  }

  @Post('fabric/stock')
  addStock(@Body() dto: AddStockDto, @GetUser('id') userId: string) {
    return this.inventoryService.addStock(dto, userId);
  }

  @Post('fabric/consume')
  recordConsumption(@Body() dto: RecordConsumptionDto, @GetUser('id') userId: string) {
    return this.inventoryService.recordConsumption(dto, userId);
  }

  @Get('fabric/:id/history')
  getStockHistory(@Param('id') id: string) {
    return this.inventoryService.getStockHistory(id);
  }
}
