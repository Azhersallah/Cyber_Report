/**
 * Upload Protected Module to Cloudflare KV
 * 
 * This script bundles your core app code and uploads it to Cloudflare KV.
 * The module will be encrypted per-machine when downloaded by activated users.
 * 
 * Usage: node scripts/upload-module.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://pppro-api.azhersallah1.workers.dev';
const ADMIN_EMAIL = 'azhersallah1@gmail.com';
const ADMIN_PASSWORD = 'a4z4h4e4r'; // Your admin password

// Files to include in the protected module (your core app code)
const PROTECTED_FILES = [
  'dist/assets/index-3jqxgenM.js',  // Main app bundle (~2MB)
];

async function bundleProtectedModule() {
  console.log('📦 Bundling protected module...');
  
  const bundle = {};
  
  for (const file of PROTECTED_FILES) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = file.replace('dist/', '');
      bundle[relativePath] = content;
      console.log(`  ✓ Added: ${file} (${(content.length / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`  ⚠ Not found: ${file}`);
    }
  }
  
  const bundleJson = JSON.stringify(bundle);
  console.log(`\n📊 Total bundle size: ${(bundleJson.length / 1024 / 1024).toFixed(2)} MB`);
  
  return Buffer.from(bundleJson, 'utf8');
}

async function uploadModule(moduleBuffer) {
  console.log('\n🚀 Uploading to Cloudflare KV...');
  
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="adminEmail"\r\n\r\n`;
    body += `${ADMIN_EMAIL}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="adminPassword"\r\n\r\n`;
    body += `${ADMIN_PASSWORD}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="module"; filename="core-module.bin"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;
    
    const bodyStart = Buffer.from(body, 'utf8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const fullBody = Buffer.concat([bodyStart, moduleBuffer, bodyEnd]);
    
    const url = new URL(API_URL + '/upload-module');
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log(`✅ Upload successful! Size: ${(result.size / 1024).toFixed(1)} KB`);
            resolve(result);
          } else {
            console.error('❌ Upload failed:', result.error);
            reject(new Error(result.error));
          }
        } catch (e) {
          console.error('❌ Parse error:', data);
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function main() {
  console.log('🔐 Protected Module Uploader\n');
  
  try {
    const moduleBuffer = await bundleProtectedModule();
    await uploadModule(moduleBuffer);
    console.log('\n✨ Done! Protected module is now on Cloudflare.');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
