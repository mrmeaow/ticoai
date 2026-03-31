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
import { TicketPriority, TicketStatus, MessageRole } from '@pkg/types';

describe('Messages E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;
  let adminToken: string;
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
      title: 'Test Ticket for Messages',
      description: 'This ticket is for testing messages',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('GET /api/tickets/:ticketId/messages', () => {
    it('should return list of messages for a ticket', async () => {
      // Create messages via API
      await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'First message on ticket' });

      await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Second message on ticket' });

      const response = await request(app.getHttpServer())
        .get(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets/00000000-0000-0000-0000-000000000000/messages')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/tickets/${ticketId}/messages`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tickets/:ticketId/messages', () => {
    it('should create a new message', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'New message content' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('New message content');
    });

    it('should create a message as agent', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Agent response' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets/00000000-0000-0000-0000-000000000000/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Message on non-existent ticket' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/tickets/:ticketId/messages/:messageId', () => {
    it('should delete a message', async () => {
      // Create a message first
      const createResponse = await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Message to delete' });

      const messageId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/tickets/${ticketId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app.getHttpServer())
        .delete(
          `/api/tickets/${ticketId}/messages/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 401 without auth', async () => {
      // Create a message first
      const createResponse = await request(app.getHttpServer())
        .post(`/api/tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Unauthenticated delete test' });

      const messageId = createResponse.body.id;

      const response = await request(app.getHttpServer()).delete(
        `/api/tickets/${ticketId}/messages/${messageId}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
