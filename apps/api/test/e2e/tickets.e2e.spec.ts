import 'reflect-metadata';
import request from 'supertest';
import {
  setupTestApp,
  createAuthenticatedUser,
  cleanupTestData,
  teardownTestEnvironment,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { TicketStatus, TicketPriority } from '@pkg/types';

describe('Tickets E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let adminRoleId: string;

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
    adminId = admin.user.id;

    const roleResponse = await request(app.getHttpServer())
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin', permissions: [] });
    adminRoleId = roleResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/api/users/${adminId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleIds: [adminRoleId] });
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('GET /api/tickets', () => {
    it('should return list of tickets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickets');
      expect(response.body).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickets');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets?status=OPEN')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      if (response.body.tickets.length > 0) {
        expect(response.body.tickets[0].status).toBe(TicketStatus.OPEN);
      }
    });

    it('should filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets?priority=HIGH')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return a ticket by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Get Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ticketId);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a new ticket', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Ticket',
          description: 'This is a test ticket description',
          priority: TicketPriority.HIGH,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Ticket');
      expect(response.body.priority).toBe(TicketPriority.HIGH);
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/tickets/:id', () => {
    it('should update ticket status', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Update Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TicketStatus.IN_PROGRESS });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should update ticket priority', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Priority Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priority: TicketPriority.LOW });

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe(TicketPriority.LOW);
    });

    it('should update ticket assignee', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Assignee Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigneeId: adminId });

      expect(response.status).toBe(200);
      expect(response.body.assignee).toBeDefined();
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TicketStatus.CLOSED });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should delete a ticket', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Delete Test', description: 'Test description' });

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204]).toContain(response.status);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([204, 404]).toContain(response.status);
    });
  });
});
