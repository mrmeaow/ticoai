const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

async function bootstrap() {
  // Dynamically import the AppModule
  const { AppModule } = await import('./dist/app.module.js');

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('TICOAI API')
    .setDescription('AI-Powered Customer Support Ticket System API')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ensure the directory exists
  const outputDir = join(__dirname, '..', 'src', 'api-docs');
  mkdirSync(outputDir, { recursive: true });

  // Write the OpenAPI spec
  writeFileSync(
    join(outputDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );

  console.log('OpenAPI spec exported to src/api-docs/openapi.json');

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
});
