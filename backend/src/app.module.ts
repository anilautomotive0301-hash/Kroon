import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { StudentsModule } from './students/students.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { WorkflowModule } from './workflow/workflow.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionModule } from './production/production.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CampusModule,
    StudentsModule,
    MeasurementsModule,
    WorkflowModule,
    InventoryModule,
    ProductionModule,
    DispatchModule,
    PaymentsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
