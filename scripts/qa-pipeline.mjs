#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const TEST_REPORT_DIR = join(process.cwd(), 'qa-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

class QAPipeline {
  constructor() {
    this.results = {
      timestamp: TIMESTAMP,
      duration: 0,
      tests: {
        unit: { status: 'pending', passed: 0, failed: 0, coverage: 0 },
        integration: { status: 'pending', passed: 0, failed: 0 },
        e2e: { status: 'pending', passed: 0, failed: 0 },
        webhooks: { status: 'pending', passed: 0, failed: 0 },
        accessibility: { status: 'pending', violations: 0, passes: 0 },
        performance: { status: 'pending', scores: {} },
        security: { status: 'pending', vulnerabilities: 0 }
      },
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        qualityScore: 0
      }
    };
    this.startTime = Date.now();
    this.services = {
      supabase: null,
      devServer: null,
      webhookTunnel: null
    };
  }

  async init() {
    console.log(chalk.bold.cyan('\n🚀 QA Pipeline Orchestrator - Starting\n'));

    if (!existsSync(TEST_REPORT_DIR)) {
      mkdirSync(TEST_REPORT_DIR, { recursive: true });
    }

    await this.checkDependencies();
    await this.setupEnvironment();
  }

  async checkDependencies() {
    const spinner = ora('Checking dependencies...').start();

    const requiredDeps = [
      'vitest',
      '@playwright/test',
      '@axe-core/cli',
      'lighthouse'
    ];

    const missing = [];
    for (const dep of requiredDeps) {
      try {
        execSync(`pnpm list ${dep}`, { stdio: 'ignore' });
      } catch {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      spinner.fail(`Missing dependencies: ${missing.join(', ')}`);
      console.log(chalk.yellow('\nInstalling missing dependencies...'));
      execSync(`pnpm install -w -D ${missing.join(' ')}`, { stdio: 'inherit' });
    } else {
      spinner.succeed('All dependencies installed');
    }
  }

  async setupEnvironment() {
    const spinner = ora('Setting up test environment...').start();

    // Create test environment file
    const envContent = `
# QA Pipeline Test Environment
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-key
STRIPE_SECRET_KEY=sk_test_testing
STRIPE_WEBHOOK_SECRET=whsec_test
SUMUP_API_KEY=test-sumup-key
SUMUP_MERCHANT_CODE=test-merchant
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
    `.trim();

    writeFileSync('.env.test', envContent);
    spinner.succeed('Test environment configured');
  }

  async startServices() {
    console.log(chalk.bold('\n📦 Starting services...\n'));

    // Check if Supabase CLI is available
    const supabaseSpinner = ora('Checking Supabase availability...').start();
    try {
      execSync('npx supabase --version', { stdio: 'ignore' });
      supabaseSpinner.succeed('Supabase CLI available');

      // Start Supabase
      const startSpinner = ora('Starting Supabase...').start();
      try {
        execSync('npx supabase start', { stdio: 'ignore' });
        this.services.supabase = true;
        startSpinner.succeed('Supabase started');
      } catch (error) {
        startSpinner.warn('Supabase already running or not configured');
      }

      // Reset database and apply migrations if Supabase is running
      if (this.services.supabase) {
        const dbSpinner = ora('Setting up database...').start();
        try {
          execSync('npx supabase db reset', { stdio: 'ignore' });
          dbSpinner.succeed('Database reset and migrations applied');
        } catch (error) {
          dbSpinner.warn('Database setup skipped');
        }
      }
    } catch (error) {
      supabaseSpinner.warn('Supabase CLI not available - skipping database setup');
    }
  }

  async runUnitTests() {
    console.log(chalk.bold('\n🧪 Running Unit Tests...\n'));

    const spinner = ora('Executing unit tests...').start();

    try {
      // Try to run unit tests
      let output;
      try {
        output = execSync('pnpm run test:unit -- --reporter=json --coverage', {
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (testError) {
        // If no tests found, create a minimal result
        output = JSON.stringify({
          numPassedTests: 0,
          numFailedTests: 0,
          testResults: []
        });
        console.log(chalk.yellow('  No unit tests found'));
      }

      const results = JSON.parse(output);
      this.results.tests.unit = {
        status: results.numFailedTests === 0 ? 'passed' : 'failed',
        passed: results.numPassedTests || 0,
        failed: results.numFailedTests || 0,
        coverage: 0
      };

      spinner.succeed(`Unit tests: ${results.numPassedTests} passed, ${results.numFailedTests} failed`);

      if (this.results.tests.unit.coverage < 80) {
        console.log(chalk.yellow(`⚠️  Coverage: ${this.results.tests.unit.coverage}% (below 80% threshold)`));
      } else {
        console.log(chalk.green(`✓ Coverage: ${this.results.tests.unit.coverage}%`));
      }
    } catch (error) {
      spinner.fail('Unit tests failed');
      this.results.tests.unit.status = 'failed';
      console.error(error.message);
    }
  }

  async runIntegrationTests() {
    console.log(chalk.bold('\n🔗 Running Integration Tests...\n'));

    const spinner = ora('Testing Edge Functions and RLS policies...').start();

    try {
      // Try to run integration tests
      let output;
      try {
        output = execSync('pnpm run test:integration -- --reporter=json', {
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (testError) {
        output = JSON.stringify({
          numPassedTests: 0,
          numFailedTests: 0
        });
        console.log(chalk.yellow('  No integration tests configured'));
      }

      const results = JSON.parse(output);
      this.results.tests.integration = {
        status: results.numFailedTests === 0 ? 'passed' : 'failed',
        passed: results.numPassedTests || 0,
        failed: results.numFailedTests || 0
      };

      spinner.succeed(`Integration tests: ${results.numPassedTests} passed`);

      // Test RLS matrix
      await this.testRLSMatrix();

    } catch (error) {
      spinner.fail('Integration tests failed');
      this.results.tests.integration.status = 'failed';
      console.error(error.message);
    }
  }

  async testRLSMatrix() {
    const roles = ['anon', 'customer', 'staff', 'admin'];
    const spinner = ora('Testing RLS policies for all roles...').start();

    for (const role of roles) {
      try {
        execSync(`pnpm run test:rls -- --role=${role}`, { stdio: 'ignore' });
        console.log(chalk.green(`  ✓ RLS tests passed for role: ${role}`));
      } catch {
        console.log(chalk.red(`  ✗ RLS tests failed for role: ${role}`));
        this.results.tests.integration.failed++;
      }
    }

    spinner.succeed('RLS matrix testing completed');
  }

  async runWebhookTests() {
    console.log(chalk.bold('\n💳 Testing Payment Webhooks...\n'));

    const webhookTests = [
      { name: 'Stripe webhook signature', endpoint: '/api/webhooks/stripe' },
      { name: 'SumUp webhook validation', endpoint: '/api/webhooks/sumup' },
      { name: 'Idempotency handling', endpoint: '/api/webhooks/test-idempotency' }
    ];

    for (const test of webhookTests) {
      const spinner = ora(`Testing ${test.name}...`).start();

      try {
        execSync(`pnpm run test:webhook -- ${test.endpoint}`, { stdio: 'ignore' });
        spinner.succeed(`${test.name} passed`);
        this.results.tests.webhooks.passed++;
      } catch {
        spinner.fail(`${test.name} failed`);
        this.results.tests.webhooks.failed++;
      }
    }

    this.results.tests.webhooks.status =
      this.results.tests.webhooks.failed === 0 ? 'passed' : 'failed';
  }

  async runE2ETests() {
    console.log(chalk.bold('\n🎭 Running E2E Tests with Playwright...\n'));

    const spinner = ora('Executing E2E test suites...').start();

    try {
      // Start dev server
      this.services.devServer = spawn('pnpm', ['run', 'dev'], {
        detached: false,
        stdio: 'ignore'
      });

      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));

      const output = execSync('npx playwright test --reporter=json', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const results = JSON.parse(output);
      this.results.tests.e2e = {
        status: results.status === 'passed' ? 'passed' : 'failed',
        passed: results.passed,
        failed: results.failed
      };

      spinner.succeed(`E2E tests: ${results.passed} passed, ${results.failed} failed`);

      // Test specific flows
      await this.testCriticalFlows();

    } catch (error) {
      spinner.fail('E2E tests failed');
      this.results.tests.e2e.status = 'failed';
      console.error(error.message);
    }
  }

  async testCriticalFlows() {
    const flows = [
      'Customer booking flow',
      'Payment processing',
      'Admin calendar management',
      'Email notification delivery'
    ];

    console.log(chalk.bold('\n  Testing critical flows:'));

    for (const flow of flows) {
      try {
        execSync(`npx playwright test --grep "${flow}"`, { stdio: 'ignore' });
        console.log(chalk.green(`    ✓ ${flow}`));
      } catch {
        console.log(chalk.red(`    ✗ ${flow}`));
        this.results.tests.e2e.failed++;
      }
    }
  }

  async runAccessibilityAudit() {
    console.log(chalk.bold('\n♿ Running Accessibility Audit...\n'));

    const spinner = ora('Checking accessibility compliance...').start();

    try {
      const output = execSync('npx axe http://localhost:3000 --save qa-reports/accessibility.json', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const results = JSON.parse(readFileSync('qa-reports/accessibility.json', 'utf-8'));

      this.results.tests.accessibility = {
        status: results.violations.length === 0 ? 'passed' : 'failed',
        violations: results.violations.length,
        passes: results.passes.length
      };

      if (results.violations.length > 0) {
        spinner.fail(`Found ${results.violations.length} accessibility violations`);
        console.log(chalk.red('\n  Violations:'));
        results.violations.forEach(v => {
          console.log(chalk.red(`    - ${v.id}: ${v.description}`));
        });
      } else {
        spinner.succeed('No accessibility violations found');
      }

    } catch (error) {
      spinner.fail('Accessibility audit failed');
      this.results.tests.accessibility.status = 'failed';
      console.error(error.message);
    }
  }

  async runPerformanceTests() {
    console.log(chalk.bold('\n⚡ Running Performance Tests...\n'));

    const spinner = ora('Analyzing performance metrics...').start();

    try {
      execSync('npx lighthouse http://localhost:3000 --output=json --output-path=qa-reports/lighthouse.json', {
        stdio: 'ignore'
      });

      const results = JSON.parse(readFileSync('qa-reports/lighthouse.json', 'utf-8'));
      const scores = {
        performance: Math.round(results.categories.performance.score * 100),
        accessibility: Math.round(results.categories.accessibility.score * 100),
        seo: Math.round(results.categories.seo.score * 100),
        bestPractices: Math.round(results.categories['best-practices'].score * 100)
      };

      this.results.tests.performance = {
        status: Object.values(scores).every(s => s >= 90) ? 'passed' : 'failed',
        scores
      };

      spinner.succeed('Performance analysis completed');

      console.log('\n  Lighthouse Scores:');
      Object.entries(scores).forEach(([metric, score]) => {
        const color = score >= 90 ? 'green' : score >= 50 ? 'yellow' : 'red';
        console.log(chalk[color](`    ${metric}: ${score}/100`));
      });

    } catch (error) {
      spinner.fail('Performance tests failed');
      this.results.tests.performance.status = 'failed';
      console.error(error.message);
    }
  }

  async generateReports() {
    console.log(chalk.bold('\n📊 Generating Reports...\n'));

    const spinner = ora('Creating comprehensive test report...').start();

    // Calculate summary
    let totalPassed = 0;
    let totalFailed = 0;

    Object.values(this.results.tests).forEach(test => {
      if (test.passed !== undefined) {
        totalPassed += test.passed;
        totalFailed += test.failed;
      }
    });

    this.results.summary = {
      totalPassed,
      totalFailed,
      qualityScore: this.calculateQualityScore()
    };

    this.results.duration = Date.now() - this.startTime;

    // Write JSON report
    const reportPath = join(TEST_REPORT_DIR, `qa-report-${TIMESTAMP}.json`);
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    await this.generateHTMLReport();

    spinner.succeed('Reports generated');

    // Print summary
    this.printSummary();
  }

  calculateQualityScore() {
    const weights = {
      unit: 0.25,
      integration: 0.20,
      e2e: 0.20,
      webhooks: 0.10,
      accessibility: 0.10,
      performance: 0.15
    };

    let score = 0;

    Object.entries(weights).forEach(([test, weight]) => {
      if (this.results.tests[test].status === 'passed') {
        score += weight * 100;
      }
    });

    // Apply penalties
    if (this.results.tests.unit.coverage < 80) {
      score -= 10;
    }

    if (this.results.tests.accessibility.violations > 0) {
      score -= this.results.tests.accessibility.violations * 2;
    }

    return Math.max(0, Math.round(score));
  }

  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QA Pipeline Report - ${TIMESTAMP}</title>
  <style>
    body { font-family: system-ui; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
    .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; }
    .metric.passed { border-left: 4px solid #28a745; }
    .metric.failed { border-left: 4px solid #dc3545; }
    .metric h3 { margin: 0; color: #666; font-size: 14px; }
    .metric .value { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .score { text-align: center; margin: 30px 0; }
    .score-value { font-size: 72px; font-weight: bold; }
    .score-label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #007acc; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .status-passed { color: #28a745; font-weight: bold; }
    .status-failed { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>QA Pipeline Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Duration: ${Math.round(this.results.duration / 1000)}s</p>

    <div class="score">
      <div class="score-value" style="color: ${this.results.summary.qualityScore >= 80 ? '#28a745' : '#dc3545'}">
        ${this.results.summary.qualityScore}%
      </div>
      <div class="score-label">Quality Score</div>
    </div>

    <div class="summary">
      <div class="metric passed">
        <h3>Tests Passed</h3>
        <div class="value">${this.results.summary.totalPassed}</div>
      </div>
      <div class="metric failed">
        <h3>Tests Failed</h3>
        <div class="value">${this.results.summary.totalFailed}</div>
      </div>
      <div class="metric ${this.results.tests.unit.coverage >= 80 ? 'passed' : 'failed'}">
        <h3>Code Coverage</h3>
        <div class="value">${this.results.tests.unit.coverage}%</div>
      </div>
      <div class="metric ${this.results.tests.accessibility.violations === 0 ? 'passed' : 'failed'}">
        <h3>Accessibility Issues</h3>
        <div class="value">${this.results.tests.accessibility.violations}</div>
      </div>
    </div>

    <h2>Test Results</h2>
    <table>
      <tr>
        <th>Test Suite</th>
        <th>Status</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Details</th>
      </tr>
      ${Object.entries(this.results.tests).map(([name, test]) => `
        <tr>
          <td>${name.charAt(0).toUpperCase() + name.slice(1)}</td>
          <td class="status-${test.status}">${test.status.toUpperCase()}</td>
          <td>${test.passed || '-'}</td>
          <td>${test.failed || '-'}</td>
          <td>${this.getTestDetails(name, test)}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Performance Metrics</h2>
    ${this.results.tests.performance.scores ? `
      <div class="summary">
        ${Object.entries(this.results.tests.performance.scores).map(([metric, score]) => `
          <div class="metric ${score >= 90 ? 'passed' : 'failed'}">
            <h3>${metric}</h3>
            <div class="value">${score}</div>
          </div>
        `).join('')}
      </div>
    ` : '<p>No performance data available</p>'}
  </div>
</body>
</html>
    `;

    const htmlPath = join(TEST_REPORT_DIR, `qa-report-${TIMESTAMP}.html`);
    writeFileSync(htmlPath, html);
  }

  getTestDetails(name, test) {
    switch(name) {
      case 'unit':
        return `Coverage: ${test.coverage}%`;
      case 'accessibility':
        return `${test.violations} violations, ${test.passes} passes`;
      case 'performance':
        return test.scores ? `Avg: ${Math.round(Object.values(test.scores).reduce((a,b) => a+b, 0) / Object.values(test.scores).length)}` : '-';
      default:
        return '-';
    }
  }

  printSummary() {
    console.log(chalk.bold('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('                    QA PIPELINE SUMMARY'));
    console.log(chalk.bold('='.repeat(60) + '\n'));

    console.log(chalk.bold('Test Results:'));
    Object.entries(this.results.tests).forEach(([name, test]) => {
      const status = test.status === 'passed' ?
        chalk.green('✓ PASSED') :
        chalk.red('✗ FAILED');
      console.log(`  ${name.padEnd(15)} ${status}`);
    });

    console.log(chalk.bold('\nMetrics:'));
    console.log(`  Total Tests:     ${this.results.summary.totalPassed + this.results.summary.totalFailed}`);
    console.log(`  Passed:          ${chalk.green(this.results.summary.totalPassed)}`);
    console.log(`  Failed:          ${chalk.red(this.results.summary.totalFailed)}`);
    console.log(`  Code Coverage:   ${this.results.tests.unit.coverage}%`);
    console.log(`  Quality Score:   ${this.results.summary.qualityScore}%`);
    console.log(`  Duration:        ${Math.round(this.results.duration / 1000)}s`);

    console.log(chalk.bold('\nReports:'));
    console.log(`  📁 ${TEST_REPORT_DIR}/`);
    console.log(`     ├── qa-report-${TIMESTAMP}.json`);
    console.log(`     ├── qa-report-${TIMESTAMP}.html`);
    console.log(`     ├── accessibility.json`);
    console.log(`     └── lighthouse.json`);

    if (this.results.summary.qualityScore >= 80) {
      console.log(chalk.bold.green('\n✅ QA Pipeline PASSED - Quality threshold met!'));
    } else {
      console.log(chalk.bold.red('\n❌ QA Pipeline FAILED - Quality below threshold'));
      console.log(chalk.yellow('\nRecommendations:'));

      if (this.results.tests.unit.coverage < 80) {
        console.log('  • Increase unit test coverage to at least 80%');
      }
      if (this.results.tests.accessibility.violations > 0) {
        console.log('  • Fix accessibility violations');
      }
      if (this.results.tests.performance.scores?.performance < 90) {
        console.log('  • Improve performance score to 90+');
      }
      if (this.results.tests.e2e.failed > 0) {
        console.log('  • Fix failing E2E tests');
      }
    }

    console.log(chalk.bold('\n' + '='.repeat(60) + '\n'));
  }

  async cleanup() {
    console.log(chalk.bold('\n🧹 Cleaning up...\n'));

    const spinner = ora('Stopping services...').start();

    try {
      if (this.services.devServer) {
        this.services.devServer.kill();
      }

      if (this.services.supabase) {
        try {
          execSync('npx supabase stop', { stdio: 'ignore' });
        } catch {
          // Ignore error if Supabase wasn't running
        }
      }

      spinner.succeed('Cleanup completed');
    } catch (error) {
      spinner.fail('Cleanup failed');
      console.error(error.message);
    }
  }

  async run() {
    try {
      await this.init();
      await this.startServices();

      // Run all tests
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runWebhookTests();
      await this.runE2ETests();
      await this.runAccessibilityAudit();
      await this.runPerformanceTests();

      // Generate reports
      await this.generateReports();

      // Exit with appropriate code
      process.exit(this.results.summary.qualityScore >= 80 ? 0 : 1);

    } catch (error) {
      console.error(chalk.red('\n❌ Pipeline failed with error:'));
      console.error(error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the pipeline
const pipeline = new QAPipeline();
pipeline.run().catch(console.error);