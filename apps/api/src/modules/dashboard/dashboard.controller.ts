import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns dashboard statistics including ticket counts by status, high priority count, and recent tickets. Admins see all tickets, other users see only their assigned tickets.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  async getDashboard(@CurrentUser() user: User) {
    const isAdmin = user.roles?.some((r) =>
      ['SUPER_ADMIN', 'ADMIN'].includes(r.name),
    );

    return this.dashboardService.getStats(user.id, isAdmin);
  }
}
