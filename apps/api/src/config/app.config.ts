import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'TICOAI',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api',
  nodeEnv: process.env.NODE_ENV || 'development',
}));
