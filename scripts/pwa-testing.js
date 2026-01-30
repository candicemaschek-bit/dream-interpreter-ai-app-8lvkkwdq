#!/usr/bin/env node

/**
 * PWA Testing Suite for Dreamcatcher AI
 * 
 * Usage:
 *   node scripts/pwa-testing.js [test-name]
 * 
 * Available tests:
 *   all               - Run all tests
 *   service-worker    - Test service worker registration
 *   offline           - Test offline functionality
 *   notifications     - Test notification API
 *   storage           - Test IndexedDB storage
 *   cache             - Test cache storage
 * 
 * Note: This script is meant to be run in browser DevTools Console
 *       after loading the app, or included as part of E2E testing.
 */

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.blue}📋 Testing: ${msg}${colors.reset}`),
  pass: (msg) => console.log(`${colors.green}  PASS: ${msg}${colors.reset}`),
  fail: (msg) => console.log(`${colors.red}  FAIL: ${msg}${colors.reset}`)
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// ============================================================================
// SERVICE WORKER TESTS
// ============================================================================

async function testServiceWorker() {
  log.test('Service Worker Registration');

  if (!('serviceWorker' in navigator)) {
    log.fail('Service workers not supported in this browser');
    testResults.failed++;
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      log.fail('Service worker not registered');
      testResults.failed++;
      return;
    }

    // Check if active
    if (!registration.active) {
      log.warning('Service worker not currently active');
      testResults.warnings++;
    } else {
      log.pass('Service worker is active');
      testResults.passed++;
    }

    // Log details
    console.log(`  Scope: ${registration.scope}`);
    console.log(`  State: ${registration.active?.state || 'not active'}`);
    console.log(`  Update Ready: ${registration.waiting ? 'Yes' : 'No'}`);

    testResults.tests.push({
      name: 'Service Worker Registration',
      status: registration.active ? 'PASS' : 'WARN'
    });

  } catch (error) {
    log.fail(`Service worker check failed: ${error.message}`);
    testResults.failed++;
  }
}

// ============================================================================
// OFFLINE TESTS
// ============================================================================

async function testOfflineSupport() {
  log.test('Offline Support');

  // Check if navigator.onLine works
  const isOnline = navigator.onLine;
  console.log(`  Currently online: ${isOnline}`);

  // Check cache storage
  try {
    const caches_available = 'caches' in window;
    if (!caches_available) {
      log.fail('Cache API not available');
      testResults.failed++;
      return;
    }

    const cacheNames = await caches.keys();
    log.pass(`Cache Storage available (${cacheNames.length} caches)`);
    testResults.passed++;

    cacheNames.forEach(name => {
      console.log(`    - ${name}`);
    });

    testResults.tests.push({
      name: 'Offline Support',
      status: 'PASS'
    });

  } catch (error) {
    log.fail(`Cache check failed: ${error.message}`);
    testResults.failed++;
  }
}

// ============================================================================
// NOTIFICATION TESTS
// ============================================================================

async function testNotifications() {
  log.test('Notifications Support');

  if (!('Notification' in window)) {
    log.fail('Notifications API not supported');
    testResults.failed++;
    return;
  }

  log.pass('Notifications API available');
  testResults.passed++;

  const permission = Notification.permission;
  console.log(`  Current permission: ${permission}`);

  if (permission === 'granted') {
    log.pass('Notification permission already granted');
    testResults.passed++;
  } else if (permission === 'denied') {
    log.warning('Notification permission denied');
    testResults.warnings++;
  } else {
    console.log('  → Click "Allow" when prompted to test');
  }

  testResults.tests.push({
    name: 'Notifications API',
    status: 'PASS'
  });
}

// ============================================================================
// STORAGE TESTS
// ============================================================================

async function testIndexedDB() {
  log.test('IndexedDB Storage');

  if (!('indexedDB' in window)) {
    log.fail('IndexedDB not available');
    testResults.failed++;
    return;
  }

  try {
    // Try to open database
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('dreamcatcher-offline');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    log.pass('IndexedDB database accessible');
    testResults.passed++;

    // Check stores
    const storeNames = Array.from(db.objectStoreNames);
    console.log(`  Stores: ${storeNames.join(', ')}`);

    if (storeNames.includes('dreams')) {
      log.pass('Dreams store exists');
      testResults.passed++;
    } else {
      log.warning('Dreams store not found');
      testResults.warnings++;
    }

    if (storeNames.includes('sync-queue')) {
      log.pass('Sync queue store exists');
      testResults.passed++;
    } else {
      log.warning('Sync queue store not found');
      testResults.warnings++;
    }

    db.close();

    testResults.tests.push({
      name: 'IndexedDB Storage',
      status: 'PASS'
    });

  } catch (error) {
    log.fail(`IndexedDB check failed: ${error.message}`);
    testResults.failed++;
  }
}

// ============================================================================
// CACHE STORAGE TESTS
// ============================================================================

async function testCacheStorage() {
  log.test('Cache Storage Functionality');

  try {
    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      log.warning('No caches found - load app to populate');
      testResults.warnings++;
      return;
    }

    log.pass(`Found ${cacheNames.length} cache(s)`);
    testResults.passed++;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      console.log(`  ${name}: ${keys.length} items`);
      
      // Show first few items
      keys.slice(0, 3).forEach(key => {
        console.log(`    - ${key.url.split('/').pop()}`);
      });
    }

    testResults.tests.push({
      name: 'Cache Storage',
      status: 'PASS'
    });

  } catch (error) {
    log.fail(`Cache storage check failed: ${error.message}`);
    testResults.failed++;
  }
}

// ============================================================================
// MANIFEST TEST
// ============================================================================

async function testManifest() {
  log.test('Web App Manifest');

  try {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      log.fail('Manifest link not found in HTML');
      testResults.failed++;
      return;
    }

    const manifestUrl = link.getAttribute('href');
    const response = await fetch(manifestUrl);
    const manifest = await response.json();

    log.pass(`Manifest loaded: ${manifest.name}`);
    testResults.passed++;

    // Check required fields
    const required = ['name', 'start_url', 'display', 'theme_color', 'icons'];
    let allPresent = true;

    required.forEach(field => {
      if (manifest[field]) {
        console.log(`  ✓ ${field}: ${typeof manifest[field] === 'object' ? JSON.stringify(manifest[field]) : manifest[field]}`);
      } else {
        console.log(`  ✗ ${field}: MISSING`);
        allPresent = false;
      }
    });

    if (allPresent) {
      log.pass('All required manifest fields present');
      testResults.passed++;
    } else {
      log.warning('Some manifest fields missing');
      testResults.warnings++;
    }

    testResults.tests.push({
      name: 'Web App Manifest',
      status: 'PASS'
    });

  } catch (error) {
    log.fail(`Manifest check failed: ${error.message}`);
    testResults.failed++;
  }
}

// ============================================================================
// META TAGS TEST
// ============================================================================

function testMetaTags() {
  log.test('PWA Meta Tags');

  const requiredTags = {
    'theme-color': { name: 'meta[name="theme-color"]' },
    'viewport': { name: 'meta[name="viewport"]' },
    'apple-mobile-web-app-capable': { name: 'meta[name="apple-mobile-web-app-capable"]' },
    'apple-mobile-web-app-status-bar-style': { name: 'meta[name="apple-mobile-web-app-status-bar-style"]' },
    'apple-touch-icon': { name: 'link[rel="apple-touch-icon"]' }
  };

  let allPresent = true;

  Object.entries(requiredTags).forEach(([tag, selector]) => {
    const element = document.querySelector(selector.name);
    if (element) {
      const content = element.getAttribute('content') || element.getAttribute('href') || 'present';
      console.log(`  ✓ ${tag}: ${content.substring(0, 50)}`);
    } else {
      console.log(`  ✗ ${tag}: MISSING`);
      allPresent = false;
    }
  });

  if (allPresent) {
    log.pass('All PWA meta tags present');
    testResults.passed++;
  } else {
    log.warning('Some meta tags missing');
    testResults.warnings++;
  }

  testResults.tests.push({
    name: 'PWA Meta Tags',
    status: allPresent ? 'PASS' : 'WARN'
  });
}

// ============================================================================
// DISPLAY MODE TEST
// ============================================================================

function testDisplayMode() {
  log.test('Display Mode (Standalone)');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSStandalone = window.navigator.standalone === true;

  if (isStandalone) {
    log.pass('App is in standalone mode');
    testResults.passed++;
  } else if (isIOS && isIOSStandalone) {
    log.pass('App is in standalone mode (iOS)');
    testResults.passed++;
  } else {
    console.log('  → Install app to browser/home screen to test standalone mode');
  }

  testResults.tests.push({
    name: 'Display Mode',
    status: 'PASS'
  });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests(testName = 'all') {
  console.clear();
  console.log(`${colors.blue}${'='.repeat(60)}`);
  console.log(`PWA Testing Suite for Dreamcatcher AI${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  const tests = {
    'all': [
      testManifest,
      testMetaTags,
      testDisplayMode,
      testServiceWorker,
      testOfflineSupport,
      testIndexedDB,
      testCacheStorage,
      testNotifications
    ],
    'service-worker': [testServiceWorker],
    'offline': [testOfflineSupport, testIndexedDB],
    'notifications': [testNotifications],
    'storage': [testIndexedDB, testCacheStorage],
    'cache': [testCacheStorage],
    'manifest': [testManifest],
    'meta-tags': [testMetaTags]
  };

  const selectedTests = tests[testName] || tests['all'];

  for (const test of selectedTests) {
    await test();
    console.log('');
  }

  // Print summary
  console.log(`${colors.blue}${'='.repeat(60)}`);
  console.log(`Test Results Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${testResults.warnings}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`\nTest Details:`);
  
  testResults.tests.forEach((test, i) => {
    const icon = test.status === 'PASS' ? '✓' : '⚠';
    const color = test.status === 'PASS' ? colors.green : colors.yellow;
    console.log(`  ${color}${icon}${colors.reset} ${test.name}`);
  });

  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log('💡 For detailed testing steps, see docs/PWA_TESTING_GUIDE.md');
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  return {
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings
  };
}

// ============================================================================
// EXPORT FOR BROWSER CONSOLE
// ============================================================================

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.PWATest = {
    run: runTests,
    runAll: () => runTests('all'),
    testServiceWorker,
    testOfflineSupport,
    testNotifications,
    testIndexedDB,
    testCacheStorage,
    testManifest,
    testMetaTags
  };

  console.log('%c✨ PWA Testing Suite Loaded', 'font-size: 14px; font-weight: bold; color: #8B5CF6;');
  console.log('%cRun tests with: PWATest.run() or PWATest.run("test-name")', 'color: #666;');
  console.log('%cAvailable tests: all, service-worker, offline, notifications, storage, cache', 'color: #666;');
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}
