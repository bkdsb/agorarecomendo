#!/usr/bin/env node

const https = require('https');

const apiKey = process.env.RAINFOREST_API_KEY || process.argv[2];
if (!apiKey) {
  console.error('Usage: RAINFOREST_API_KEY=... node scripts/rf-account-check.js');
  process.exit(1);
}

const url = `https://api.rainforestapi.com/account?api_key=${encodeURIComponent(apiKey)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: json }, null, 2));
    } catch {
      console.log(JSON.stringify({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data }, null, 2));
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});
