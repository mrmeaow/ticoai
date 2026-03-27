import 'reflect-metadata';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

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

    // Update environment variables with actual container ports
    // Use 127.0.0.1 explicitly to avoid IPv6 issues
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = postgres.getMappedPort(5432).toString();
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = redis.getMappedPort(6379).toString();

    // Clear module cache and dynamically import AppModule
    jest.resetModules();
    const { AppModule } = require('../../src/app.module');

    // Setup test module
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  }, 120000);

  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
    await redis?.stop();
  }, 120000);

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
