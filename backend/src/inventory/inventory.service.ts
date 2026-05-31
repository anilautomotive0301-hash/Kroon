import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AddStockDto {
  fabricItemId: string;
  quantity: number;
  supplierName?: string;
  invoiceNo?: string;
  notes?: string;
}

export interface RecordConsumptionDto {
  fabricItemId: string;
  quantity: number;
  tailorJobId?: string;
  notes?: string;
}

export interface CreateFabricItemDto {
  name: string;
  code: string;
  description?: string;
  unit?: string;
  unitPrice?: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getFabricItems() {
    const items = await this.prisma.fabricItem.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { stockEntries: true, consumptions: true } },
      },
    });

    const withBalance = await Promise.all(
      items.map(async (item) => {
        const balance = await this.getBalance(item.id);
        return { ...item, balance };
      }),
    );

    return withBalance;
  }

  async getBalance(fabricItemId: string): Promise<number> {
    const [stockAgg, consumptionAgg] = await Promise.all([
      this.prisma.fabricStock.aggregate({
        where: { fabricItemId },
        _sum: { quantity: true },
      }),
      this.prisma.fabricConsumption.aggregate({
        where: { fabricItemId },
        _sum: { quantity: true },
      }),
    ]);

    return (stockAgg._sum.quantity || 0) - (consumptionAgg._sum.quantity || 0);
  }

  async createFabricItem(dto: CreateFabricItemDto) {
    return this.prisma.fabricItem.create({ data: dto });
  }

  async addStock(dto: AddStockDto, userId: string) {
    const item = await this.prisma.fabricItem.findUnique({
      where: { id: dto.fabricItemId },
    });
    if (!item) throw new NotFoundException('Fabric item not found');

    return this.prisma.fabricStock.create({
      data: { ...dto, addedById: userId },
      include: { fabricItem: true },
    });
  }

  async recordConsumption(dto: RecordConsumptionDto, userId: string) {
    const item = await this.prisma.fabricItem.findUnique({
      where: { id: dto.fabricItemId },
    });
    if (!item) throw new NotFoundException('Fabric item not found');

    return this.prisma.fabricConsumption.create({
      data: { ...dto, recordedById: userId },
      include: { fabricItem: true },
    });
  }

  async getStockHistory(fabricItemId: string) {
    const [entries, consumptions] = await Promise.all([
      this.prisma.fabricStock.findMany({
        where: { fabricItemId },
        include: { addedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fabricConsumption.findMany({
        where: { fabricItemId },
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { entries, consumptions, balance: await this.getBalance(fabricItemId) };
  }
}
