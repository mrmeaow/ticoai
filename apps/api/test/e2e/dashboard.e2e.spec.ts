import 'reflect-metadata';
import {
  setupTestApp,
  createAuthenticatedUser,
  createTestTicket,
  cleanupTestData,
  teardownTestEnvironment,
} from './setup';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@pkg/types';

describe('Dashboard E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    const { app: testApp } = await setupTestApp();
    app = testApp;

    const user = await createAuthenticatedUser(app, {
      email: 'user@test.com',
      name: 'Regular User',
      roles: ['USER'],
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const admin = await createAuthenticatedUser(app, {
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['ADMIN'],
    });
    adminToken = admin.accessToken;

    await createTestTicket(app, userId, {
      title: 'Open Ticket 1',
      description: 'Open ticket description',
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
    });

    await createTestTicket(app, userId, {
      title: 'In Progress Ticket',
      description: 'In progress description',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
    });

    await createTestTicket(app, userId, {
      title: 'Resolved Ticket',
      description: 'Resolved description',
      priority: TicketPriority.LOW,
      status: TicketStatus.RESOLVED,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('GET /api/dashboard', () => {
    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer()).get('/api/dashboard');
      expect(response.status).toBe(401);
    });

    it('should return dashboard stats for regular user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('open');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('resolved');
      expect(response.body).toHaveProperty('closed');
      expect(response.body).toHaveProperty('highPriority');
      expect(response.body).toHaveProperty('recent');
    });

    it('should return all stats for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('open');
      expect(response.body).toHaveProperty('inProgress');
      expect(response.body).toHaveProperty('resolved');
      expect(response.body).toHaveProperty('closed');
      expect(response.body).toHaveProperty('highPriority');
      expect(response.body).toHaveProperty('recent');
    });

    it('should have correct response structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.open).toBe('number');
      expect(typeof response.body.inProgress).toBe('number');
      expect(typeof response.body.resolved).toBe('number');
      expect(typeof response.body.closed).toBe('number');
      expect(typeof response.body.highPriority).toBe('number');
      expect(Array.isArray(response.body.recent)).toBe(true);
    });

    it('should return valid stats for created tickets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.open).toBeGreaterThan(0);
    });
  });
});
