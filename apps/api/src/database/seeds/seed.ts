import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { RolesService } from '../../modules/roles/roles.service';
import { UsersService } from '../../modules/users/users.service';
import { dataSourceOptions } from '../data-source';

async function bootstrap() {
  const logger = new Logger('Seeder');
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    logger.log('Database connection established');

    const app = await NestFactory.createApplicationContext(AppModule);
    const rolesService = app.get(RolesService);
    const usersService = app.get(UsersService);

    // Initialize default roles
    logger.log('Seeding default roles...');
    await rolesService.initializeDefaultRoles();
    await rolesService.initializeDefaultPermissions();

    // Assign permissions to roles
    const permissions = await rolesService.findAllPermissions();
    const superAdminRole = await rolesService.findRoleByName('SUPER_ADMIN');
    const adminRole = await rolesService.findRoleByName('ADMIN');
    const agentRole = await rolesService.findRoleByName('AGENT');
    const viewerRole = await rolesService.findRoleByName('VIEWER');

    if (superAdminRole) {
      for (const permission of permissions) {
        try {
          await rolesService.assignPermissionToRole(
            superAdminRole.id,
            permission.id,
          );
        } catch (e: any) {
          if (!e.message?.includes('already exists')) {
            throw e;
          }
        }
      }
      logger.log('SUPER_ADMIN: All permissions assigned');
    }

    if (adminRole) {
      const adminPermissions = permissions.filter(
        (p) =>
          !['roles:create', 'roles:delete', 'users:delete'].includes(
            `${p.resource}:${p.action}`,
          ),
      );
      for (const permission of adminPermissions) {
        try {
          await rolesService.assignPermissionToRole(
            adminRole.id,
            permission.id,
          );
        } catch (e: any) {
          if (!e.message?.includes('already exists')) {
            throw e;
          }
        }
      }
      logger.log('ADMIN: Permissions assigned');
    }

    if (agentRole) {
      const agentPermissions = permissions.filter(
        (p) =>
          ['tickets', 'messages', 'ai'].includes(p.resource) ||
          (p.resource === 'users' && p.action === 'read') ||
          (p.resource === 'dashboard' && p.action === 'read'),
      );
      for (const permission of agentPermissions) {
        try {
          await rolesService.assignPermissionToRole(
            agentRole.id,
            permission.id,
          );
        } catch (e: any) {
          if (!e.message?.includes('already exists')) {
            throw e;
          }
        }
      }
      logger.log('AGENT: Permissions assigned');
    }

    if (viewerRole) {
      const viewerPermissions = permissions.filter(
        (p) =>
          p.action === 'read' &&
          ['tickets', 'messages', 'dashboard'].includes(p.resource),
      );
      for (const permission of viewerPermissions) {
        try {
          await rolesService.assignPermissionToRole(
            viewerRole.id,
            permission.id,
          );
        } catch (e: any) {
          if (!e.message?.includes('already exists')) {
            throw e;
          }
        }
      }
      logger.log('VIEWER: Permissions assigned');
    }

    // Create default admin user
    logger.log('Seeding default admin user...');
    try {
      await usersService.create(
        'admin@ticoai.local',
        'admin123',
        'System Admin',
        ['SUPER_ADMIN'],
      );
      logger.log('Default admin user created: admin@ticoai.local / admin123');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        logger.log('Admin user already exists');
      } else {
        throw e;
      }
    }

    await app.close();
    await dataSource.destroy();
    logger.log('Seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed', error);
    process.exit(1);
  }
}

bootstrap();
