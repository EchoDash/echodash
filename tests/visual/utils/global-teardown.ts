import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global teardown for EchoDash visual testing
 * 
 * This runs once after all tests and handles:
 * - Test result aggregation
 * - Cleanup of temporary files
 * - Final report generation
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting EchoDash Visual Testing Cleanup...');

  const reportsPath = path.join(process.cwd(), 'tests', 'visual', 'reports');
  const resultsPath = path.join(reportsPath, 'results.json');

  // Generate summary report if results exist
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.reduce((acc: number, suite: any) => 
          acc + (suite.specs?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: results.duration || 0
      };

      // Count test results
      const countResults = (suite: any) => {
        if (suite.specs) {
          suite.specs.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              test.results?.forEach((result: any) => {
                switch (result.status) {
                  case 'passed':
                    summary.passed++;
                    break;
                  case 'failed':
                    summary.failed++;
                    break;
                  case 'skipped':
                    summary.skipped++;
                    break;
                }
              });
            });
          });
        }
        if (suite.suites) {
          suite.suites.forEach(countResults);
        }
      };

      results.suites?.forEach(countResults);

      // Save summary
      fs.writeFileSync(
        path.join(reportsPath, 'summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('📊 Test Summary:');
      console.log(`   Total: ${summary.totalTests}`);
      console.log(`   ✅ Passed: ${summary.passed}`);
      console.log(`   ❌ Failed: ${summary.failed}`);
      console.log(`   ⏭️  Skipped: ${summary.skipped}`);
      console.log(`   ⏱️  Duration: ${Math.round(summary.duration / 1000)}s`);

    } catch (error) {
      console.warn('⚠️  Could not generate test summary:', error);
    }
  }

  // Clean up old screenshots (keep last 10 runs)
  const screenshotsPath = path.join(process.cwd(), 'tests', 'visual', 'screenshots');
  if (fs.existsSync(screenshotsPath)) {
    const files = fs.readdirSync(screenshotsPath)
      .filter(file => file.startsWith('diff-'))
      .map(file => ({
        name: file,
        path: path.join(screenshotsPath, file),
        stat: fs.statSync(path.join(screenshotsPath, file))
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    // Keep only the 50 most recent diff images
    const filesToDelete = files.slice(50);
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.warn(`⚠️  Could not delete old screenshot: ${file.name}`);
      }
    });

    if (filesToDelete.length > 0) {
      console.log(`🗑️  Cleaned up ${filesToDelete.length} old screenshot(s)`);
    }
  }

  console.log('✅ Global teardown complete!');
}

export default globalTeardown;