import 'reflect-metadata';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { Ticket } from '../../src/modules/tickets/entities/ticket.entity';
import { Message } from '../../src/modules/messages/entities/message.entity';
import { Role } from '../../src/modules/roles/entities/role.entity';
import { Permission } from '../../src/modules/roles/entities/permission.entity';
import { AiResult } from '../../src/modules/ai/entities/ai-result.entity';
import { TicketStatus, TicketPriority, MessageRole } from '@pkg/types';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../../src/modules/roles/roles.service';

export interface TestContainerConfig {
  postgres: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
  bullRedis: StartedRedisContainer;
}

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  moduleRef: TestingModule;
}

let containers: TestContainerConfig | null = null;
let testApp: TestApp | null = null;

const DEFAULT_PASSWORD = 'testpassword123';

export async function setupTestEnvironment(): Promise<TestContainerConfig> {
  const postgres = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const redis = await new RedisContainer('redis:7-alpine').start();

  const bullRedis = await new RedisContainer('redis:7-alpine').start();

  const postgresPort = postgres.getMappedPort(5432);
  const redisPort = redis.getMappedPort(6379);
  const bullRedisPort = bullRedis.getMappedPort(6379);

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(postgresPort);
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_DATABASE = 'test_db';

  // No password for testcontainers Redis - prevents warning spam
  process.env.REDIS_HOST = '127.0.0.1';
  process.env.REDIS_PORT = String(redisPort);
  process.env.REDIS_PASSWORD = '';

  process.env.BULL_REDIS_HOST = '127.0.0.1';
  process.env.BULL_REDIS_PORT = String(bullRedisPort);
  process.env.BULL_REDIS_PASSWORD = '';

  process.env.QUEUE_REDIS_HOST = '127.0.0.1';
  process.env.QUEUE_REDIS_PORT = String(bullRedisPort);

  containers = { postgres, redis, bullRedis };
  return containers;
}

async function assignAllPermissionsToRole(
  dataSource: DataSource,
  roleName: string,
): Promise<void> {
  const rolesRepository = dataSource.getRepository(Role);
  const permissionsRepository = dataSource.getRepository(Permission);

  const role = await rolesRepository.findOne({ where: { name: roleName } });
  if (!role) return;

  const permissions = await permissionsRepository.find();

  for (const permission of permissions) {
    try {
      await dataSource.query(
        'INSERT INTO "role_permissions" ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [role.id, permission.id],
      );
    } catch (e: any) {
      if (!e.code?.includes('23505')) {
        throw e;
      }
    }
  }
}

export async function setupTestApp(): Promise<TestApp> {
  if (!containers) {
    await setupTestEnvironment();
  }

  jest.resetModules();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();

  const dataSource = app.get<DataSource>(DataSource);

  const rolesService = moduleRef.get(RolesService);
  await rolesService.initializeDefaultRoles();
  await rolesService.initializeDefaultPermissions();

  await assignAllPermissionsToRole(dataSource, 'SUPER_ADMIN');
  await assignAllPermissionsToRole(dataSource, 'ADMIN');

  testApp = { app, dataSource, moduleRef };
  return testApp;
}

export async function cleanupTestData(): Promise<void> {
  if (!testApp) return;

  const { dataSource } = testApp;

  await dataSource.query('DELETE FROM "messages"');
  await dataSource.query('DELETE FROM "tickets"');
  await dataSource.query('DELETE FROM "ai_results"');
  await dataSource.query('DELETE FROM "users"');
}

export async function teardownTestEnvironment(): Promise<void> {
  if (testApp?.app) {
    await testApp.app.close();
    testApp = null;
  }

  if (containers) {
    await containers.bullRedis.stop();
    await containers.redis.stop();
    await containers.postgres.stop();
    containers = null;
  }
}

export async function createAuthenticatedUser(
  app: INestApplication,
  options?: {
    email?: string;
    name?: string;
    password?: string;
    roles?: string[];
  },
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const dataSource = app.get<DataSource>(DataSource);
  const rolesRepository = dataSource.getRepository(Role);
  const usersRepository = dataSource.getRepository(User);

  const email = options?.email || `test-${Date.now()}@example.com`;
  const name = options?.name || 'Test User';
  const password = options?.password || DEFAULT_PASSWORD;
  const rolesToAssign = options?.roles || ['USER'];

  const roleEntities: Role[] = [];
  for (const roleName of rolesToAssign) {
    let role = await rolesRepository.findOne({ where: { name: roleName } });
    if (!role) {
      role = rolesRepository.create({ name: roleName });
      await rolesRepository.save(role);
    }
    roleEntities.push(role);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = usersRepository.create({
    email,
    name,
    passwordHash,
    isActive: true,
    roles: roleEntities,
  });
  const savedUser = await usersRepository.save(user);

  const request = require('supertest');
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });

  return {
    user: savedUser,
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

export async function createTestTicket(
  app: INestApplication,
  userId: string,
  options?: {
    title?: string;
    description?: string;
    priority?: TicketPriority;
    status?: TicketStatus;
    assigneeId?: string;
  },
): Promise<Ticket> {
  const dataSource = app.get<DataSource>(DataSource);
  const ticketsRepository = dataSource.getRepository(Ticket);
  const usersRepository = dataSource.getRepository(User);

  const createdBy = await usersRepository.findOne({ where: { id: userId } });
  if (!createdBy) {
    throw new Error('User not found');
  }

  let assignee: User | undefined;
  if (options?.assigneeId) {
    assignee = await usersRepository.findOne({
      where: { id: options.assigneeId },
    });
  }

  const ticket = ticketsRepository.create({
    title: options?.title || 'Test Ticket',
    description: options?.description || 'Test ticket description',
    priority: options?.priority || TicketPriority.MEDIUM,
    status: options?.status || TicketStatus.OPEN,
    createdBy,
    assignee,
  });
  return ticketsRepository.save(ticket);
}

export async function createTestMessage(
  app: INestApplication,
  ticketId: string,
  senderId: string,
  options?: {
    content?: string;
    role?: MessageRole;
    aiJobId?: string;
  },
): Promise<Message> {
  const dataSource = app.get<DataSource>(DataSource);
  const messagesRepository = dataSource.getRepository(Message);
  const ticketsRepository = dataSource.getRepository(Ticket);
  const usersRepository = dataSource.getRepository(User);

  const ticket = await ticketsRepository.findOne({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const sender = await usersRepository.findOne({ where: { id: senderId } });
  if (!sender) {
    throw new Error('Sender not found');
  }

  const message = messagesRepository.create({
    content: options?.content || 'Test message content',
    role: options?.role || MessageRole.AGENT,
    ticket,
    sender,
    aiJobId: options?.aiJobId,
  });
  return messagesRepository.save(message);
}

export function getTestApp(): TestApp | null {
  return testApp;
}

export function getContainers(): TestContainerConfig | null {
  return containers;
}

export function getBaseUrl(app: INestApplication): string {
  const server = app.getHttpServer();
  const address = server.address() as { address: string; port: number };
  return `http://${address.address}:${address.port}`;
}
