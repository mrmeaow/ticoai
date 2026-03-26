module.exports = {
  ticoai: {
    input: {
      target: '../../apps/api/src/api-docs/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/generated/ticoai-api.ts',
      schemas: './src/generated/schemas',
      client: 'axios-functions',
      mock: false,
      override: {
        useTypeOverInterfaces: true,
      },
      clean: true,
    },
  },
};
