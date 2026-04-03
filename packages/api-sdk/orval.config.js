module.exports = {
  ticoai: {
    input: {
      target: 'http://localhost:3030/api/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/generated/ticoai-api.ts',
      schemas: './src/generated/schemas',
      client: 'axios-functions',
      mock: false,
      override: {
        useTypeOverInterfaces: true,
        mutator: {
          path: './src/mutator.ts',
          name: 'customInstance',
        },
      },
      allParamsOptional: true,
      urlEncodeParameters: true,
      clean: true,
    },
  },
};
