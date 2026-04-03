import 'reflect-metadata';
import {
  setupTestApp,
  createAuthenticatedUser,
  cleanupTestData,
  teardownTestEnvironment,
} from './setup';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('Roles E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const { app: testApp } = await setupTestApp();
    app = testApp;

    const user = await createAuthenticatedUser(app, {
      email: 'user@test.com',
      password: 'password123',
      name: 'Regular User',
      roles: ['USER'],
    });
    userToken = user.accessToken;

    const admin = await createAuthenticatedUser(app, {
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User',
      roles: ['ADMIN'],
    });
    adminToken = admin.accessToken;
  }, 120000);

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestEnvironment();
  });

  describe('GET /api/roles', () => {
    it('should list all roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include permissions in roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('rolePermissions');
      }
    });
  });

  describe('GET /api/roles/permissions', () => {
    it('should list all permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TestRole' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('TestRole');
    });

    it('should return 409 for duplicate role name', async () => {
      await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DuplicateRole' });

      const response = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DuplicateRole' });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/roles/permissions', () => {
    it('should create a new permission', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/roles/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'custom-resource', action: 'custom-action' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.resource).toBe('custom-resource');
      expect(response.body.action).toBe('custom-action');
    });

    it('should return 409 for duplicate resource:action', async () => {
      await request(app.getHttpServer())
        .post('/api/roles/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'users', action: 'read' });

      const response = await request(app.getHttpServer())
        .post('/api/roles/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'users', action: 'read' });

      expect(response.status).toBe(409);
    });
  });
});
