import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import type { Request } from 'express';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const userId = req.user?.['sub']
    return this.dashboardService.getStats(userId);
  }
}
