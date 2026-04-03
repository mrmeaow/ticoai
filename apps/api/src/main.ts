import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', '/api');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS - allow all origins in development
  app.enableCors({
    origin:
      nodeEnv === 'development'
        ? 'http://localhost:4200'
        : configService.get<string>('web.url'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger (OpenAPI) - only in development
  if (nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TICOAI API')
      .setDescription(
        'AI-Powered Customer Support Ticket System API\n\n' +
          'This API provides endpoints for managing support tickets, ' +
          'users, roles, permissions, and AI-powered features.\n\n' +
          '## Authentication\n' +
          'Most endpoints require authentication via JWT Bearer token. ' +
          'Use the **Authorize** button above to enter your access token.\n\n' +
          '## Available Tags\n' +
          '- **Health**: API health check\n' +
          '- **Auth**: Registration, login, refresh, logout\n' +
          '- **Users**: User management and profiles\n' +
          '- **Roles**: Role and permission management\n' +
          '- **Tickets**: Support ticket CRUD operations\n' +
          '- **Messages**: Ticket message management\n' +
          '- **AI**: AI-powered ticket analysis and reply suggestions\n' +
          '- **SSE**: Server-Sent Events for real-time AI job updates\n' +
          '- **Dashboard**: Dashboard statistics and metrics\n',
      )
      .setVersion('2.0.0')
      .setContact(
        'TICOAI Support',
        'https://ticoai.com/support',
        'support@ticoai.com',
      )
      .setLicense('Proprietary', 'https://ticoai.com/license')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'access-token',
      )
      .addCookieAuth('refreshToken', {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token stored in HTTP-only cookie',
      })
      .addTag('Health', 'API health and status endpoints')
      .addTag('Auth', 'Authentication and authorization')
      .addTag('Users', 'User management operations')
      .addTag('Roles', 'Role and permission management')
      .addTag('Tickets', 'Support ticket operations')
      .addTag('Messages', 'Ticket message operations')
      .addTag('AI', 'AI-powered ticket analysis')
      .addTag('SSE', 'Server-Sent Events for real-time updates')
      .addTag('Dashboard', 'Dashboard statistics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
      },
      customSiteTitle: 'TICOAI API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    // Serve raw OpenAPI JSON
    app.use('/api/openapi.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(document, null, 2));
    });
  }

  // Fallback for SPA routing (production only)
  if (nodeEnv === 'production') {
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.url.startsWith(apiPrefix)) {
        return next();
      }
      res.sendFile('index.html', {
        root: join(__dirname, '..', '..', 'apps', 'web', 'browser'),
      });
    });
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`OpenAPI spec: http://localhost:${port}/api/openapi.json`);
}

bootstrap();
