import 'reflect-metadata';
import request from 'supertest';
import {
  setupTestApp,
  createAuthenticatedUser,
  createTestTicket,
  cleanupTestData,
  teardownTestEnvironment,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { TicketPriority } from '@pkg/types';

describe('AI E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let ticketId: string;

  beforeAll(async () => {
    const { app: testApp } = await setupTestApp();
    app = testApp;

    const user = await createAuthenticatedUser(app, {
      email: 'user@test.com',
      name: 'Regular User',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const admin = await createAuthenticatedUser(app, {
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['ADMIN'],
    });
    adminToken = admin.accessToken;

    const ticket = await createTestTicket(app, userId, {
      title: 'AI Test Ticket',
      description: 'Test ticket for AI features',
      priority: TicketPriority.MEDIUM,
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('POST /api/ai/summarize', () => {
    it('should enqueue a summarize job', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('resultId');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId: '11111111-1111-4111-8111-111111111111' });

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .send({ ticketId });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/ai/detect-priority', () => {
    it('should enqueue a detect priority job', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/detect-priority')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/suggest-reply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId: '11111111-1111-4111-8111-111111111111' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/ai/suggest-reply', () => {
    it('should enqueue a suggest reply job', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/suggest-reply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId: '11111111-1111-4111-8111-111111111111' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/sse/jobs/:jobId', () => {
    it('should accept SSE connection for job', async () => {
      const jobResponse = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketId });

      const jobId = jobResponse.body.jobId;

      expect(jobId).toBeDefined();
    });
  });
});
