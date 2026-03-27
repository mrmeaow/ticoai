import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    // Always read from environment variables directly for test compatibility
    const host = process.env.REDIS_HOST || this.configService.get<string>('redis.host') || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || this.configService.get<string | undefined>('redis.password');
    const nodeEnv = process.env.NODE_ENV || this.configService.get<string>('app.nodeEnv') || 'development';
    const isTest = nodeEnv === 'test';

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: isTest ? null : (times) => {
        if (times > 10) {
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      connectTimeout: isTest ? 5000 : 10000,
      maxRetriesPerRequest: isTest ? 3 : null,
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async onModuleInit() {
    await this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
