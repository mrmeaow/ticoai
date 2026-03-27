import 'reflect-metadata';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Auth E2E', () => {
  let postgres: any;
  let redis: any;
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Start test containers
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

    // Clear module cache and require AppModule
    jest.resetModules();
    const { AppModule } = require('../../src/app.module');

    // Setup test module
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 120000);

  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
    await redis?.stop();
  }, 120000);

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      console.log('Register response:', response.status, response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      console.log('Invalid email response:', response.status, response.body);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
          name: 'Login Test',
        });

      // Then login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      authToken = response.body.accessToken;
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
