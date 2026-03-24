/**
 * Meetify Test Runner
 * 
 * Unified test runner for all test suites
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  unit: {
    pattern: 'unit.test.js',
    runner: 'node --test'
  },
  integration: {
    pattern: 'integration.test.js',
    runner: 'node --test'
  },
  bugs: {
    pattern: 'bugs.test.js',
    runner: 'node --test'
  },
  e2e: {
    pattern: '*.spec.js',
    runner: 'npx playwright test'
  }
};

// Colors for output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runTests(type) {
  const config = CONFIG[type];
  if (!config) {
    log(`Unknown test type: ${type}`, 'red');
    return { success: false, error: 'Unknown type' };
  }

  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running ${type.toUpperCase()} Tests`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');

  try {
    const result = execSync(`${config.runner} ${config.pattern}`, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    log(result, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(error.stdout || error.message, 'red');
    return { success: false, error: error.stdout || error.message };
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length
    },
    results
  };

  // Save report
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('TEST SUMMARY', 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
  
  log(`Total Suites: ${report.summary.total}`, 'blue');
  log(`Passed: ${report.summary.passed}`, 'green');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  log(`\nReport saved to: ${reportPath}`, 'blue');
  
  return report;
}

function runAll() {
  log('\n🚀 Meetify Test Suite\n', 'cyan');
  
  const results = {};
  
  // Run unit tests
  results.unit = runTests('unit');
  
  // Run integration tests
  results.integration = runTests('integration');
  
  // Run bug tests
  results.bugs = runTests('bugs');
  
  // Generate report
  const report = generateReport(results);
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

function runCoverage() {
  log('\n📊 Generating Coverage Report\n', 'cyan');
  
  try {
    // Run tests with coverage
    const result = execSync('npx c8 node --test unit.test.js integration.test.js bugs.test.js', {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'unit':
    runTests('unit');
    break;
  case 'integration':
    runTests('integration');
    break;
  case 'bugs':
    runTests('bugs');
    break;
  case 'e2e':
    runTests('e2e');
    break;
  case 'coverage':
    runCoverage();
    break;
  case 'all':
  default:
    runAll();
    break;
}