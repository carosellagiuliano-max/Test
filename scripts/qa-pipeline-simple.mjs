#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_REPORT_DIR = join(process.cwd(), 'qa-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

console.log('\n🚀 QA Pipeline - Running Available Tests\n');

// Create reports directory
if (!existsSync(TEST_REPORT_DIR)) {
  mkdirSync(TEST_REPORT_DIR, { recursive: true });
}

const results = {
  timestamp: TIMESTAMP,
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Test runners
const tests = [
  {
    name: 'Dependencies Check',
    command: 'pnpm list',
    type: 'setup'
  },
  {
    name: 'TypeScript Compilation',
    command: 'pnpm run type-check',
    type: 'validation'
  },
  {
    name: 'Linting',
    command: 'pnpm run lint',
    type: 'validation'
  },
  {
    name: 'Format Check',
    command: 'pnpm run format:check',
    type: 'validation'
  },
  {
    name: 'Unit Tests',
    command: 'pnpm run test:unit',
    type: 'test'
  },
  {
    name: 'Integration Tests',
    command: 'pnpm run test:integration',
    type: 'test'
  },
  {
    name: 'E2E Tests',
    command: 'pnpm run test:e2e',
    type: 'test'
  }
];

// Run each test
for (const test of tests) {
  console.log(`\n📋 ${test.name}...`);

  try {
    const startTime = Date.now();
    execSync(test.command, { stdio: 'inherit' });
    const duration = Date.now() - startTime;

    results.tests.push({
      name: test.name,
      type: test.type,
      status: 'passed',
      duration
    });
    results.summary.passed++;

    console.log(`✅ ${test.name} - PASSED (${duration}ms)`);
  } catch (error) {
    // Check if command exists
    if (error.message?.includes('run-script')) {
      results.tests.push({
        name: test.name,
        type: test.type,
        status: 'skipped',
        reason: 'Script not configured'
      });
      results.summary.skipped++;
      console.log(`⏭️  ${test.name} - SKIPPED (not configured)`);
    } else {
      results.tests.push({
        name: test.name,
        type: test.type,
        status: 'failed',
        error: error.message
      });
      results.summary.failed++;
      console.log(`❌ ${test.name} - FAILED`);
    }
  }
}

// Generate report
console.log('\n' + '='.repeat(60));
console.log('                    QA PIPELINE SUMMARY');
console.log('='.repeat(60));
console.log(`\n✅ Passed: ${results.summary.passed}`);
console.log(`❌ Failed: ${results.summary.failed}`);
console.log(`⏭️  Skipped: ${results.summary.skipped}`);

// Save JSON report
const reportPath = join(TEST_REPORT_DIR, `qa-report-${TIMESTAMP}.json`);
writeFileSync(reportPath, JSON.stringify(results, null, 2));

// Generate HTML report
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QA Report - ${TIMESTAMP}</title>
  <style>
    body { font-family: system-ui; margin: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
    .summary { display: flex; gap: 20px; margin: 30px 0; }
    .metric { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
    .metric.passed { border-left: 4px solid #28a745; }
    .metric.failed { border-left: 4px solid #dc3545; }
    .metric.skipped { border-left: 4px solid #ffc107; }
    .value { font-size: 32px; font-weight: bold; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #007acc; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .status-passed { color: #28a745; }
    .status-failed { color: #dc3545; }
    .status-skipped { color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <h1>QA Pipeline Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="metric passed">
        <div>Passed</div>
        <div class="value">${results.summary.passed}</div>
      </div>
      <div class="metric failed">
        <div>Failed</div>
        <div class="value">${results.summary.failed}</div>
      </div>
      <div class="metric skipped">
        <div>Skipped</div>
        <div class="value">${results.summary.skipped}</div>
      </div>
    </div>

    <table>
      <tr>
        <th>Test</th>
        <th>Type</th>
        <th>Status</th>
        <th>Duration</th>
      </tr>
      ${results.tests.map(test => `
        <tr>
          <td>${test.name}</td>
          <td>${test.type}</td>
          <td class="status-${test.status}">${test.status.toUpperCase()}</td>
          <td>${test.duration ? test.duration + 'ms' : test.reason || '-'}</td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>
`;

const htmlPath = join(TEST_REPORT_DIR, `qa-report-${TIMESTAMP}.html`);
writeFileSync(htmlPath, html);

console.log(`\n📁 Reports saved to: ${TEST_REPORT_DIR}`);
console.log(`   - JSON: qa-report-${TIMESTAMP}.json`);
console.log(`   - HTML: qa-report-${TIMESTAMP}.html`);

process.exit(results.summary.failed > 0 ? 1 : 0);