import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  prefix: process.env.QUEUE_PREFIX || 'bull:ticoai',
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
}));
