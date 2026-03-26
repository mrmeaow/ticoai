module.exports = {
  input: '../../apps/api/src/api-docs/openapi.json',
  output: {
    mode: 'split',
    target: './src/generated',
    schemas: './src/generated/schemas',
    client: './src/generated/client',
  },
  hooks: {
    afterAllFilesWrite: 'prettier --write',
  },
};
