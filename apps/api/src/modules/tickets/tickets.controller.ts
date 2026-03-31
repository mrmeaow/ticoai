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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketListResponseDto } from './dto/ticket-list-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Permissions('tickets:read')
  @ApiOperation({
    summary: 'List all tickets',
    description:
      'Returns a paginated list of tickets with optional filters. Agents see only their assigned tickets, admins see all tickets.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TicketStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: TicketPriority,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    description: 'Filter by assignee ID (UUID)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Free-text search in title and description',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination (UUID of last item from previous page)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
    type: TicketListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Get ticket by ID',
    description:
      'Retrieves a single ticket by its unique identifier including messages and AI results.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket found',
    type: Ticket,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
        summary: 'Ticket Not Found',
        value: {
          statusCode: 404,
          error: 'Not Found',
          message:
            'Ticket with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.findById(id);
  }

  @Post()
  @Permissions('tickets:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new ticket',
    description:
      'Creates a new support ticket. Agents and Admins can create tickets. Regular users can only create tickets for themselves.',
  })
  @ApiBody({
    type: CreateTicketDto,
    description: 'Ticket creation data',
    examples: {
      standard: {
        summary: 'Standard Ticket',
        value: {
          title: 'Unable to login to customer portal',
          description:
            'Customer reports being unable to access the dashboard after successful login.',
          priority: 'MEDIUM',
        },
      },
      urgent: {
        summary: 'High Priority Ticket',
        value: {
          title: 'Production database connection failing',
          description:
            'All database connections are timing out. Production system is down.',
          priority: 'CRITICAL',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket created successfully',
    type: Ticket,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
    examples: {
      validationError: {
        summary: 'Validation Error',
        value: {
          statusCode: 400,
          error: 'Bad Request',
          message: [
            'title must be shorter than or equal to 200 characters',
            'description must be at least 10 characters',
          ],
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  async create(
    @Body() body: CreateTicketDto,
    @CurrentUser('id') createdById: string,
  ): Promise<Ticket> {
    return this.ticketsService.create({ ...body, createdById });
  }

  @Patch(':id')
  @Permissions('tickets:update')
  @ApiOperation({
    summary: 'Update a ticket',
    description:
      'Updates an existing ticket. Can update title, description, status, priority, and assignee.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateTicketDto,
    description: 'Fields to update (all optional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket updated successfully',
    type: Ticket,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.ticketsService.update(id, body);
  }

  @Delete(':id')
  @Permissions('tickets:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a ticket',
    description: 'Soft deletes a ticket. Only admins can delete tickets.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket unique identifier (UUID)',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Ticket deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.ticketsService.delete(id);
  }
}
