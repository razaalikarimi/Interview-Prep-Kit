import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  target: 'node20',
  noExternal: ['@interview-prep/shared', 'zod'],
  bundle: true,
  clean: true,
});
