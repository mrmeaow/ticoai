import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @Permissions('ai:create')
  async summarize(@Body('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.aiService.summarize(ticketId);
  }

  @Post('detect-priority')
  @Permissions('ai:create')
  async detectPriority(@Body('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.aiService.detectPriority(ticketId);
  }

  @Post('suggest-reply')
  @Permissions('ai:create')
  async suggestReply(@Body('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.aiService.suggestReply(ticketId);
  }
}
