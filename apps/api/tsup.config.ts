import { defineConfig } from 'tsup';

export default defineConfig([
  // Build for dist/server.js (local dev / Docker / start)
  {
    entry: {
      server: 'src/server.ts',
    },
    outDir: 'dist',
    format: ['cjs'],
    target: 'node20',
    noExternal: ['@interview-prep/shared', 'zod'],
    bundle: true,
    clean: false,
  },
  // Build self-contained serverless bundle directly into apps/api/api/index.js
  {
    entry: {
      index: 'src/server.ts',
    },
    outDir: 'api',
    format: ['cjs'],
    target: 'node20',
    noExternal: ['@interview-prep/shared', 'zod'],
    bundle: true,
    clean: false,
  },
]);
