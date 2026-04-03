import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { StartedTestContainer } from 'testcontainers';

export interface TestContainers {
  postgres: StartedTestContainer;
  redis: StartedTestContainer;
}

export async function startTestContainers(): Promise<TestContainers> {
  const postgres = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const redis = await new RedisContainer('redis:7-alpine').start();

  return { postgres, redis };
}

export async function stopTestContainers(
  containers: TestContainers,
): Promise<void> {
  await containers.postgres.stop();
  await containers.redis.stop();
}
