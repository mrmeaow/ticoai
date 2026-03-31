import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SummarizeTicketDto } from './dto/summarize-ticket.dto';
import { DetectPriorityDto } from './dto/detect-priority.dto';
import { SuggestReplyDto } from './dto/suggest-reply.dto';
import { AiJobResponseDto } from './dto/ai-job-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @Permissions('ai:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Summarize a ticket',
    description:
      'Queues an AI job to summarize a ticket and its conversation history. Returns a job ID for tracking progress via SSE.',
  })
  @ApiBody({ type: SummarizeTicketDto })
  @ApiResponse({
    status: 201,
    description: 'AI summarization job queued successfully',
    type: AiJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ticket ID',
    type: ErrorResponseDto,
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
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async summarize(@Body() body: SummarizeTicketDto) {
    return this.aiService.summarize(body.ticketId);
  }

  @Post('detect-priority')
  @Permissions('ai:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Detect ticket priority',
    description:
      'Queues an AI job to analyze a ticket and detect its priority level (LOW, MEDIUM, HIGH, CRITICAL). Returns a job ID for tracking progress via SSE.',
  })
  @ApiBody({ type: DetectPriorityDto })
  @ApiResponse({
    status: 201,
    description: 'AI priority detection job queued successfully',
    type: AiJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ticket ID',
    type: ErrorResponseDto,
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
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async detectPriority(@Body() body: DetectPriorityDto) {
    return this.aiService.detectPriority(body.ticketId);
  }

  @Post('suggest-reply')
  @Permissions('ai:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Suggest a reply',
    description:
      'Queues an AI job to generate a suggested reply for a ticket. The reply will be automatically added as a message upon completion. Returns a job ID for tracking progress via SSE.',
  })
  @ApiBody({ type: SuggestReplyDto })
  @ApiResponse({
    status: 201,
    description: 'AI reply suggestion job queued successfully',
    type: AiJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ticket ID',
    type: ErrorResponseDto,
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
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    type: ErrorResponseDto,
  })
  async suggestReply(@Body() body: SuggestReplyDto) {
    return this.aiService.suggestReply(body.ticketId);
  }
}
