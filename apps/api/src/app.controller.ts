import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeController,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns a simple health check response to verify the API is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and running',
    schema: {
      example: 'Hello World! TICOAI API is running.',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
