import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';

@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Permissions('tickets:read')
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
  ) {
    const isAdmin = user.roles?.some((r) =>
      ['SUPER_ADMIN', 'ADMIN'].includes(r.name),
    );

    return this.ticketsService.findAll(
      {
        status,
        priority,
        assigneeId,
        search,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        cursor,
      },
      user.id,
      isAdmin,
    );
  }

  @Get(':id')
  @Permissions('tickets:read')
  async findOne(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.findById(id);
  }

  @Post()
  @Permissions('tickets:create')
  async create(
    @Body() body: { title: string; description: string; priority?: TicketPriority; assigneeId?: string },
    @CurrentUser('id') createdById: string,
  ): Promise<Ticket> {
    return this.ticketsService.create({ ...body, createdById });
  }

  @Patch(':id')
  @Permissions('tickets:update')
  async update(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      description?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string;
    },
  ): Promise<Ticket> {
    return this.ticketsService.update(id, body);
  }

  @Delete(':id')
  @Permissions('tickets:delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.ticketsService.delete(id);
  }
}
