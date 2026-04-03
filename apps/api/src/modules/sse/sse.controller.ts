import {
  Controller,
  Get,
  Param,
  Sse,
  MessageEvent,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService, SseJobResult } from './sse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SseJobResultDto } from './dto/sse-job-result.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('SSE')
@Controller('sse/jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get(':jobId')
  @Permissions('ai:read')
  @Sse()
  @ApiOperation({
    summary: 'Stream AI job results via SSE',
    description:
      'Establishes a Server-Sent Events (SSE) connection to receive real-time updates for an AI processing job. Events include status changes (pending, processing, completed, failed) and results. Use the token query parameter for authentication if cookies are not available.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'AI job unique identifier to subscribe to',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'token',
    required: false,
    description: 'JWT token for authentication (alternative to cookie auth)',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream established. Events contain SseJobResult data.',
    type: SseJobResultDto,
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
  streamJobResults(
    @Param('jobId') jobId: string,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
    // Token extracted from query param by JwtAuthGuard for SSE compatibility
    const stream$ = this.sseService.addClient(jobId);

    return stream$.pipe(
      map(
        (result: SseJobResult): MessageEvent => ({
          type: 'message',
          data: JSON.stringify(result),
        }),
      ),
    );
  }
}
