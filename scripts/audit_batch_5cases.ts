import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { BatchOutputSchema } from '@interview-prep/shared';

async function runBatch5CasesAudit() {
  console.log('--- STARTING BATCH EVALUATOR 5-CASES AUDIT ---');

  // 1. Start mock server on 8099 for Case 5 (nested localhost path)
  const server = http.createServer((req, res) => {
    if (req.url === '/nested/acme/' || req.url === '/nested/acme') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
  <head><title>Acme Corporation</title></head>
  <body>
    <h1>Welcome to Acme</h1>
    <p>Acme develops mission-critical infrastructure tools.</p>
    <a href="/nested/acme/about">About Us</a>
  </body>
</html>`);
    } else if (req.url === '/nested/acme/about') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
  <head><title>About Acme</title></head>
  <body>
    <p>Founded in 2020, Acme is an engineering team building cloud services.</p>
  </body>
</html>`);
    } else if (req.url === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('User-agent: *\nAllow: /');
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve) => server.listen(8099, () => resolve()));
  console.log(' Mock HTTP server listening on port 8099');

  const cases = [
    {
      id: 'case-1-detailed',
      jd: 'Senior Backend Engineer with Node.js, Express, MongoDB, and TypeScript.',
      company_url: 'https://stripe.com',
      days: 3,
    },
    {
      id: 'case-2-thin',
      jd: 'Frontend developer needed.',
      company_url: 'https://vercel.com',
      days: 2,
    },
    {
      id: 'case-3-no-hiring',
      jd: 'Software Engineer for web development with HTML, CSS, JavaScript.',
      company_url: 'https://example.com',
      days: 3,
    },
    {
      id: 'case-4-unreachable',
      jd: 'Reliability Engineer for distributed networks.',
      company_url: 'https://nonexistent-domain-xyz-123456789.com',
      days: 2,
    },
    {
      id: 'case-5-nested-localhost',
      jd: 'Infrastructure Engineer with Go, Linux, and Cloud.',
      company_url: 'http://localhost:8099/nested/acme/',
      days: 2,
    },
  ];

  const inputFile = path.resolve('seed/batch_5cases.json');
  const outputFile = path.resolve('seed/batch_5cases_output.json');

  await fs.writeFile(inputFile, JSON.stringify(cases, null, 2));

  try {
    console.log('Running: npm run evaluate -- --input seed/batch_5cases.json --output seed/batch_5cases_output.json');
    execSync(`npx tsx scripts/evaluate.ts --input seed/batch_5cases.json --output seed/batch_5cases_output.json`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        SSRF_ALLOW_HOSTS: 'localhost,127.0.0.1',
        EVAL_MODE: 'true',
      },
    });

    const rawOutput = await fs.readFile(outputFile, 'utf-8');
    const parsed = JSON.parse(rawOutput);

    // Validate schema
    const validation = BatchOutputSchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error(`BatchOutput failed schema validation: ${JSON.stringify(validation.error.errors)}`);
    }

    console.log('\n--- EVALUATING BATCH RESULTS ---');
    const kits = parsed.kits;
    console.log(`Total cases processed: ${kits.length}`);

    const case1 = kits.find((k: any) => k.id === 'case-1-detailed');
    const case2 = kits.find((k: any) => k.id === 'case-2-thin');
    const case3 = kits.find((k: any) => k.id === 'case-3-no-hiring');
    const case4 = kits.find((k: any) => k.id === 'case-4-unreachable');
    const case5 = kits.find((k: any) => k.id === 'case-5-nested-localhost');

    console.log(`Case 1 (Detailed): ${case1?.status}`);
    console.log(`Case 2 (Thin JD): ${case2?.status}`);
    console.log(`Case 3 (No hiring page): ${case3?.status}`);
    console.log(`Case 4 (Unreachable): ${case4?.status}, Error: ${case4?.error?.code}`);
    console.log(`Case 5 (Nested localhost): ${case5?.status}`);

    if (case1?.status !== 'ok') throw new Error('Case 1 should have succeeded');
    if (case2?.status !== 'ok') throw new Error('Case 2 (thin JD) should have succeeded');
    if (case3?.status !== 'ok') throw new Error('Case 3 (no hiring page) should have succeeded without failure');
    if (case4?.status !== 'failed') throw new Error('Case 4 (unreachable) should have been recorded as failed');
    if (case5?.status !== 'ok') throw new Error('Case 5 (nested localhost) should have succeeded in eval mode');

    console.log('\n ALL 5 BATCH CASES PASSED EXACTLY AS REQUIRED!\n');
  } finally {
    server.close();
    await fs.rm(inputFile, { force: true });
    await fs.rm(outputFile, { force: true });
  }
}

runBatch5CasesAudit().catch((err) => {
  console.error('❌ BATCH AUDIT FAILED:', err);
  process.exit(1);
});
