import {
  ArgumentMetadata,
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: PaginationParams, metadata: ArgumentMetadata) {
    const page = value.page
      ? Math.max(1, parseInt(value.page.toString(), 10))
      : 1;
    const limit = value.limit
      ? Math.min(100, Math.max(1, parseInt(value.limit.toString(), 10)))
      : 20;

    return { page, limit };
  }
}
