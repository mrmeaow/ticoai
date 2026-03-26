import { Controller, Get, Param, Sse, MessageEvent, Query, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService, SseJobResult } from './sse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('sse/jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get(':jobId')
  @Permissions('ai:read')
  @Sse()
  streamJobResults(
    @Param('jobId') jobId: string,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
    // Token extracted from query param by JwtAuthGuard for SSE compatibility
    const stream$ = this.sseService.addClient(jobId);

    return stream$.pipe(
      map((result: SseJobResult): MessageEvent => ({
        type: 'message',
        data: JSON.stringify(result),
      })),
    );
  }
}
