import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Read environment variables at runtime (not at module load time)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'ticoai',
    password: process.env.DB_PASSWORD || 'ticoai_secret',
    database: process.env.DB_DATABASE || 'ticoai',
    synchronize: process.env.NODE_ENV === 'test',
    autoLoadEntities: process.env.NODE_ENV === 'test',
  };
});
