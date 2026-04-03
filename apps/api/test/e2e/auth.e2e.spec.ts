import 'reflect-metadata';
import request from 'supertest';
import {
  setupTestApp,
  createAuthenticatedUser,
  cleanupTestData,
  teardownTestEnvironment,
} from './setup';
import { INestApplication } from '@nestjs/common';

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { app: testApp } = await setupTestApp();
    app = testApp;
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      await request(app.getHttpServer()).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'First User',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          name: 'Second User',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `logintest-${Date.now()}@example.com`;

      await request(app.getHttpServer()).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'Login Test',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
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

  describe('POST /api/auth/refresh', () => {
    it('should return error when no refresh token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({});

      // API returns 200 with error body when no token
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const email = `logout-${Date.now()}@example.com`;

      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          name: 'Logout Test',
        });

      const { accessToken } = registerResponse.body;

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});
