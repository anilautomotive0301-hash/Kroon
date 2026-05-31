import {
  Body, Controller, Get, Param, Patch, Post, Query,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  findAll(
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.studentsService.findAll(campusId, search, +page, +limit);
  }

  @Get('qr/:qrCode')
  findByQr(@Param('qrCode') qrCode: string) {
    return this.studentsService.findByQr(qrCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/qr-image')
  getQrCodeImage(@Param('id') id: string) {
    return this.studentsService.getQrCodeImage(id);
  }

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateStudentDto>) {
    return this.studentsService.update(id, dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('campusId') campusId: string,
    @GetUser('id') userId: string,
  ) {
    return this.studentsService.bulkImport(
      campusId,
      file.buffer,
      file.mimetype,
      file.originalname,
      userId,
    );
  }
}
