import { Injectable, NotFoundException } from '@nestjs/common';
import { VisitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class CampusService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.campus.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { students: true, visits: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        _count: { select: { students: true } },
      },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return campus;
  }

  async create(dto: CreateCampusDto) {
    return this.prisma.campus.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateCampusDto>) {
    await this.findOne(id);
    return this.prisma.campus.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.campus.update({ where: { id }, data: { isActive: false } });
  }

  // Campus Visits
  async createVisit(campusId: string, dto: CreateVisitDto) {
    await this.findOne(campusId);
    return this.prisma.campusVisit.create({
      data: { campusId, ...dto, scheduledAt: new Date(dto.scheduledAt) },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async updateVisitStatus(visitId: string, status: VisitStatus) {
    const visit = await this.prisma.campusVisit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found');

    const data: Record<string, any> = { status };
    if (status === VisitStatus.STARTED) data.startedAt = new Date();
    if (status === VisitStatus.COMPLETED) data.completedAt = new Date();

    return this.prisma.campusVisit.update({ where: { id: visitId }, data });
  }

  async getVisits(campusId: string) {
    return this.prisma.campusVisit.findMany({
      where: { campusId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { measurements: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }
}
