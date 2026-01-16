// src/audit-log/audit-log.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuditLogService } from './audit-log.service';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // Récupérer tous les logs
  @Get()
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllLogs() {
    const records = await this.auditLogService.getAllLogs();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }
}