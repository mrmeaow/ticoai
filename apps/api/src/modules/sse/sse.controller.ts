import { Controller, Get, Param, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable, interval, EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SseService } from './sse.service';
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
  streamJobResults(@Param('jobId') jobId: string): Observable<MessageEvent> {
    const hasClient = this.sseService.hasClient(jobId);

    if (!hasClient) {
      this.sseService.addClient(jobId);
    }

    return interval(1000).pipe(
      switchMap(() => {
        return EMPTY;
      }),
      map((): MessageEvent => ({
        data: { status: 'waiting', message: 'Waiting for AI job result...' },
      })),
    );
  }
}
