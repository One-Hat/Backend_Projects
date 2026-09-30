// Automated integration tests for URL Shortener API
const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Project 1 (URL Shortener) Integration Tests...\n');

  try {
    // Test 1: Shorten URL
    console.log('🔹 Test 1: POST /api/shorten with valid URL');
    const shortenRes = await request('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { originalUrl: 'https://github.com/One-Hat/Backend_Projects' });

    if (shortenRes.statusCode !== 201) {
      throw new Error(`Expected 201, got ${shortenRes.statusCode}: ${JSON.stringify(shortenRes.body)}`);
    }
    const shortCode = shortenRes.body.data.shortCode;
    console.log(`   ✅ URL shortened successfully! Code: ${shortCode}\n`);

    // Test 2: Validation rejection
    console.log('🔹 Test 2: POST /api/shorten with invalid URL schema');
    const invalidRes = await request('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { originalUrl: 'not-a-valid-url' });

    if (invalidRes.statusCode !== 400) {
      throw new Error(`Expected 400, got ${invalidRes.statusCode}`);
    }
    console.log('   ✅ Malformed payload properly rejected with HTTP 400\n');

    // Test 3: Stats retrieval before click
    console.log('🔹 Test 3: GET /api/stats/:code');
    const statsRes1 = await request(`/api/stats/${shortCode}`, { method: 'GET' });
    if (statsRes1.statusCode !== 200 || statsRes1.body.data.clicks !== 0) {
      throw new Error(`Expected clicks=0, got ${JSON.stringify(statsRes1.body)}`);
    }
    console.log('   ✅ Initial stats verified (clicks: 0)\n');

    // Test 4: Redirect endpoint
    console.log('🔹 Test 4: GET /:code redirection');
    const redirectRes = await request(`/${shortCode}`, { method: 'GET' });
    if (redirectRes.statusCode !== 302 || redirectRes.headers.location !== 'https://github.com/One-Hat/Backend_Projects') {
      throw new Error(`Expected 302 redirect, got ${redirectRes.statusCode}`);
    }
    console.log('   ✅ HTTP 302 redirect verified to original target\n');

    // Test 5: Stats retrieval after click
    console.log('🔹 Test 5: Verify click counter increment');
    const statsRes2 = await request(`/api/stats/${shortCode}`, { method: 'GET' });
    if (statsRes2.body.data.clicks !== 1) {
      throw new Error(`Expected clicks=1, got ${statsRes2.body.data.clicks}`);
    }
    console.log('   ✅ Click counter incremented successfully (clicks: 1)\n');

    console.log('🎉 ALL URL SHORTENER TESTS PASSED! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

// Auto-run if server is reachable
request('/api/stats/ping')
  .catch(() => {})
  .then(() => runTests());
