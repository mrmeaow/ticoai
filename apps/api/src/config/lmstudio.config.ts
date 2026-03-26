import { registerAs } from '@nestjs/config';

export default registerAs('lmstudio', () => ({
  url: process.env.LMSTUDIO_URL || 'http://localhost:1234',
  model: process.env.LMSTUDIO_MODEL || 'local-model',
}));
