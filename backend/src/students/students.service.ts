import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gender, WorkflowState } from '@prisma/client';
import * as QRCode from 'qrcode';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(campusId?: string, search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = {
      ...(campusId && { campusId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { studentCode: { contains: search, mode: 'insensitive' as const } },
          { class: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          campus: { select: { id: true, name: true } },
          workflow: { select: { currentState: true } },
          sizeAssignment: { select: { shirtSize: true, trouserSize: true } },
        },
        skip,
        take: limit,
        orderBy: [{ class: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.student.count({ where }),
    ]);

    return { students, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        campus: true,
        measurements: {
          include: { measuredBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        sizeAssignment: {
          include: {
            assignedBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
        },
        workflow: {
          include: {
            history: {
              include: { changedBy: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        payments: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findByQr(qrCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { qrCode },
      include: {
        campus: { select: { id: true, name: true } },
        sizeAssignment: true,
        workflow: { select: { currentState: true } },
        measurements: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!student) throw new NotFoundException('Student not found for this QR code');
    return student;
  }

  async create(dto: CreateStudentDto) {
    const qrCode = await this.generateQrCode();
    const student = await this.prisma.student.create({
      data: { ...dto, qrCode },
    });

    await this.prisma.studentWorkflow.create({
      data: { studentId: student.id, currentState: WorkflowState.REGISTERED },
    });

    return student;
  }

  async update(id: string, dto: Partial<CreateStudentDto>) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: dto });
  }

  async getQrCodeImage(id: string): Promise<string> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { qrCode: true, name: true, studentCode: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    return QRCode.toDataURL(student.qrCode, { width: 300, margin: 2 });
  }

  async bulkImport(
    campusId: string,
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    userId: string,
  ) {
    const rows = this.parseFile(fileBuffer, mimeType, fileName);
    if (!rows.length) throw new BadRequestException('No valid rows found in file');

    const batch = await this.prisma.importBatch.create({
      data: {
        campusId,
        fileName,
        totalRows: rows.length,
        uploadedById: userId,
      },
    });

    let successRows = 0;
    let failedRows = 0;

    for (const row of rows) {
      try {
        const qrCode = await this.generateQrCode();
        const student = await this.prisma.student.upsert({
          where: { campusId_studentCode: { campusId, studentCode: String(row.studentCode || row.student_code || row['Student Code'] || '') } },
          create: {
            campusId,
            importBatchId: batch.id,
            qrCode,
            studentCode: String(row.studentCode || row.student_code || row['Student Code'] || ''),
            name: String(row.name || row.Name || ''),
            class: String(row.class || row.Class || row.grade || ''),
            section: row.section || row.Section || undefined,
            gender: this.parseGender(row.gender || row.Gender),
            age: row.age ? Number(row.age) : undefined,
            parentName: row.parentName || row.parent_name || row['Parent Name'] || undefined,
            parentPhone: row.parentPhone || row.parent_phone || row['Parent Phone'] || undefined,
          },
          update: {
            name: String(row.name || row.Name || ''),
            class: String(row.class || row.Class || row.grade || ''),
            section: row.section || row.Section || undefined,
          },
        });

        const existingWorkflow = await this.prisma.studentWorkflow.findUnique({
          where: { studentId: student.id },
        });
        if (!existingWorkflow) {
          await this.prisma.studentWorkflow.create({
            data: { studentId: student.id, currentState: WorkflowState.REGISTERED },
          });
        }

        successRows++;
      } catch {
        failedRows++;
      }
    }

    return this.prisma.importBatch.update({
      where: { id: batch.id },
      data: { successRows, failedRows, status: 'COMPLETED' },
    });
  }

  private parseFile(buffer: Buffer, mimeType: string, fileName = ''): Record<string, any>[] {
    const isCsv =
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      mimeType === 'text/plain' ||
      fileName.toLowerCase().endsWith('.csv');

    if (isCsv) {
      const text = buffer.toString('utf-8');
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      return result.data as Record<string, any>[];
    }

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  private parseGender(value: string): Gender {
    const v = String(value || '').toLowerCase();
    if (v === 'female' || v === 'f') return Gender.FEMALE;
    if (v === 'other') return Gender.OTHER;
    return Gender.MALE;
  }

  private async generateQrCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean;
    do {
      code = 'KRN-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const found = await this.prisma.student.findUnique({ where: { qrCode: code } });
      exists = !!found;
    } while (exists);
    return code;
  }
}
