import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tickets E2E', () => {
  let postgres: any;
  let redis: any;
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .start();

    redis = await new RedisContainer('redis:7-alpine')
      .start();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_CONFIG')
      .useValue({ url: postgres.getConnectionUri() })
      .overrideProvider('REDIS_CONFIG')
      .useValue({ url: redis.getConnectionUrl() })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Register and login to get auth token
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'ticket-test@example.com', password: 'password123', name: 'Ticket Test' });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ticket-test@example.com', password: 'password123' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
    await redis?.stop();
  });

  describe('POST /api/tickets', () => {
    it('should create a new ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Ticket',
          description: 'This is a test ticket description',
          priority: 'HIGH',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Ticket');
    });
  });

  describe('GET /api/tickets', () => {
    it('should return list of tickets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickets');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets?status=OPEN')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return a ticket by id', async () => {
      // First create a ticket
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Get Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ticketId);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
