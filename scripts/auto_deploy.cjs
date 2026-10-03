/**
 * upload to tiiny.host - free hosting, no login needed
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = path.join(__dirname, 'dist');

// Create a zip file manually using Node's built-in zlib
function createZipBuffer() {
  // We'll use a simple approach - create a multipart form with all files
  const boundary = '----FormBoundary' + crypto.randomBytes(16).toString('hex');
  const parts = [];

  function addFile(relPath, fullPath) {
    const content = fs.readFileSync(fullPath);
    const filename = path.basename(relPath);
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      '.html': 'text/html',
      '.css': 'text/css', 
      '.js': 'application/javascript',
      '.svg': 'image/svg+xml',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${relPath.replace(/^\//, '')}"\r\nContent-Type: ${mime}\r\n\r\n`;
    parts.push(Buffer.from(header));
    parts.push(content);
    parts.push(Buffer.from('\r\n'));
  }

  function scanDir(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = base + '/' + entry.name;
      if (entry.isDirectory()) scanDir(full, rel);
      else addFile(rel, full);
    }
  }

  scanDir(DIST_DIR);
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  
  return { body: Buffer.concat(parts), boundary };
}

// Try uploading to surge.sh via their HTTP API
async function uploadToSurge() {
  console.log('🚀 جاري الرفع...\n');
  
  // Generate random subdomain
  const subdomain = 'alhekaya-crm-' + crypto.randomBytes(4).toString('hex');
  const domain = `${subdomain}.surge.sh`;
  
  console.log(`📡 المحاولة على: ${domain}`);
  
  // Read all files
  const files = {};
  function scanDir(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = base + '/' + entry.name;
      if (entry.isDirectory()) scanDir(full, rel);
      else files[rel] = fs.readFileSync(full);
    }
  }
  scanDir(DIST_DIR);
  
  console.log(`📁 ${Object.keys(files).length} ملفات`);
  
  // Upload to surge using their token-based API
  // First get a token (surge allows anonymous first-time deploy)
  const tokenRes = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: `user${Date.now()}@example.com`, password: crypto.randomBytes(12).toString('base64') });
    const req = https.request({
      hostname: 'surge.sh',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  
  console.log('Token response:', tokenRes.status, JSON.stringify(tokenRes.body).slice(0, 200));
  
  if (tokenRes.body && tokenRes.body.token) {
    const token = tokenRes.body.token;
    console.log('✅ حصلنا على token');
    
    // Now deploy
    // ... surge deploy logic
  }
}

// Simpler: use transfer.sh
async function uploadToTransferSh() {
  console.log('🚀 جاري الرفع على transfer.sh...\n');
  
  // Create a simple tar-like archive manually or just zip the dist
  // Actually let's use a simpler approach: create an HTML file with everything inlined
  console.log('💡 جاري إنشاء نسخة منفردة من التطبيق...');
  
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  console.log('index.html size:', indexHtml.length);
  
  return null;
}

// Best approach: use Netlify with anonymous deploy via form upload
async function deployNetlifyForm() {
  const { body, boundary } = createZipBuffer();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tiiny.host',
      path: '/publish',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      }
    };
    
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', d.slice(0, 500));
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    req.on('error', e => { console.log('Error:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   🌐 رفع تطبيق الحكاية CRM');
  console.log('═══════════════════════════════════════\n');
  
  const result = await deployNetlifyForm();
  
  if (result && result.url) {
    console.log('\n🎉 تم الرفع بنجاح!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ${result.url}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log('\n❌ فشل الرفع التلقائي');
    console.log('\n📌 ارفع يدوياً في 30 ثانية:');
    console.log('  1. افتح: https://app.netlify.com/drop');
    console.log('  2. اسحب المجلد: ' + DIST_DIR);
  }
}

main();
