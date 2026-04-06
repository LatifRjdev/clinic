import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { StorageModule } from './modules/storage/storage.module';
import { AppCacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { EmrModule } from './modules/emr/emr.module';
import { BillingModule } from './modules/billing/billing.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditModule } from './modules/audit/audit.module';
import { ChatModule } from './modules/chat/chat.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StaffModule } from './modules/staff/staff.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BranchesModule } from './modules/branches/branches.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { CounterpartyModule } from './modules/counterparty/counterparty.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TaxModule } from './modules/tax/tax.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { SystemModule } from './modules/system/system.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { PublicModule } from './modules/public/public.module';
import { RolesModule } from './modules/roles/roles.module';
import { BackupModule } from './modules/backup/backup.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    StorageModule,
    AppCacheModule,
    AuthModule,
    PatientsModule,
    SchedulingModule,
    EmrModule,
    BillingModule,
    DocumentsModule,
    AuditModule,
    ChatModule,
    TasksModule,
    StaffModule,
    NotificationsModule,
    BranchesModule,
    InsuranceModule,
    PayrollModule,
    CounterpartyModule,
    ReportsModule,
    TaxModule,
    InventoryModule,
    AnalyticsModule,
    MarketingModule,
    SystemModule,
    PdfModule,
    PublicModule,
    RolesModule,
    BackupModule,
    TelemedicineModule,
    ReviewsModule,
    ContactMessagesModule,
    LoyaltyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
