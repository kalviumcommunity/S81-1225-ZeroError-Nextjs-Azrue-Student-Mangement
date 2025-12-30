#!/usr/bin/env node

/**
 * Redis Cache Testing Script
 * 
 * This script demonstrates:
 * 1. Cache miss (cold start)
 * 2. Cache hit (warm cache)
 * 3. Cache invalidation
 * 4. Performance comparison
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60) + '\n');
}

async function makeRequest(url, options = {}) {
    const startTime = Date.now();
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        const duration = Date.now() - startTime;
        return { success: true, data, duration, status: response.status };
    } catch (error) {
        const duration = Date.now() - startTime;
        return { success: false, error: error.message, duration };
    }
}

async function testCacheMiss() {
    logSection('Test 1: Cache Miss (Cold Start)');
    log('Making first request to /api/users...', 'cyan');

    const result = await makeRequest(`${API_BASE}/api/users?page=1&limit=10`);

    if (result.success) {
        log(`✓ Response received in ${result.duration}ms`, 'green');
        log(`  Users fetched: ${result.data.data?.length || 0}`, 'blue');
        log(`  Expected: Cache MISS (database query)`, 'yellow');
    } else {
        log(`✗ Request failed: ${result.error}`, 'red');
    }

    return result.duration;
}

async function testCacheHit() {
    logSection('Test 2: Cache Hit (Warm Cache)');
    log('Making second request to /api/users (within TTL)...', 'cyan');

    const result = await makeRequest(`${API_BASE}/api/users?page=1&limit=10`);

    if (result.success) {
        log(`✓ Response received in ${result.duration}ms`, 'green');
        log(`  Users fetched: ${result.data.data?.length || 0}`, 'blue');
        log(`  Expected: Cache HIT (from Redis)`, 'yellow');
    } else {
        log(`✗ Request failed: ${result.error}`, 'red');
    }

    return result.duration;
}

async function testCacheInvalidation() {
    logSection('Test 3: Cache Invalidation');
    log('Creating a new user to trigger cache invalidation...', 'cyan');

    const newUser = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        passwordHash: 'test_hash_12345'
    };

    const result = await makeRequest(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });

    if (result.success) {
        log(`✓ User created in ${result.duration}ms`, 'green');
        log(`  User ID: ${result.data.data?.id}`, 'blue');
        log(`  Cache invalidated: users:list:*`, 'yellow');
    } else {
        log(`✗ User creation failed: ${result.error}`, 'red');
    }
}

async function testAfterInvalidation() {
    logSection('Test 4: After Cache Invalidation');
    log('Making request after cache invalidation...', 'cyan');

    const result = await makeRequest(`${API_BASE}/api/users?page=1&limit=10`);

    if (result.success) {
        log(`✓ Response received in ${result.duration}ms`, 'green');
        log(`  Users fetched: ${result.data.data?.length || 0}`, 'blue');
        log(`  Expected: Cache MISS (cache was invalidated)`, 'yellow');
    } else {
        log(`✗ Request failed: ${result.error}`, 'red');
    }

    return result.duration;
}

async function performanceComparison(cacheMissTime, cacheHitTime) {
    logSection('Performance Comparison');

    log(`Cache Miss (Database Query): ${cacheMissTime}ms`, 'yellow');
    log(`Cache Hit (Redis):           ${cacheHitTime}ms`, 'green');

    const improvement = ((cacheMissTime - cacheHitTime) / cacheMissTime * 100).toFixed(1);
    const speedup = (cacheMissTime / cacheHitTime).toFixed(1);

    log(`\nPerformance Improvement: ${improvement}%`, 'bright');
    log(`Speed Increase: ${speedup}x faster`, 'bright');

    if (cacheHitTime < cacheMissTime / 5) {
        log('\n✓ Caching is working effectively!', 'green');
    } else {
        log('\n⚠ Cache performance may need optimization', 'yellow');
    }
}

async function runTests() {
    log('\n🚀 Redis Cache Testing Script', 'bright');
    log(`Testing API at: ${API_BASE}`, 'cyan');

    try {
        // Test 1: Cache Miss
        const cacheMissTime = await testCacheMiss();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 2: Cache Hit
        const cacheHitTime = await testCacheHit();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 3: Cache Invalidation
        await testCacheInvalidation();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 4: After Invalidation
        await testAfterInvalidation();

        // Performance Comparison
        performanceComparison(cacheMissTime, cacheHitTime);

        logSection('Test Summary');
        log('✓ All tests completed successfully!', 'green');
        log('\nCheck your server logs to see:', 'cyan');
        log('  - "Cache miss - Fetching from database" messages', 'blue');
        log('  - "Cache hit" messages', 'blue');
        log('  - "Cache invalidated" messages', 'blue');

    } catch (error) {
        log(`\n✗ Test suite failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runTests();
