import { defineConfig } from 'tsup';

const footerJs =
  'if (typeof module !== "undefined" && module.exports) {\n' +
  '  var _exp = module.exports.default || module.exports.app || module.exports;\n' +
  '  module.exports = _exp;\n' +
  '  module.exports.default = _exp;\n' +
  '  module.exports.app = _exp;\n' +
  '}\n';

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
    footer: {
      js: footerJs,
    },
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
    footer: {
      js: footerJs,
    },
  },
]);
