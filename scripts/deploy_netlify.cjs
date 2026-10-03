/**
 * deploy_netlify.cjs
 * رفع مجلد dist على Netlify بدون login
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const DIST_DIR = path.join(__dirname, 'dist');

// ====== حساب SHA1 لكل ملف ======
function sha1File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(content).digest('hex');
}

// ====== قراءة كل ملفات dist ======
function getAllFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base + '/' + entry.name;
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, relPath));
    } else {
      files.push({ fullPath, relPath, sha1: sha1File(fullPath) });
    }
  }
  return files;
}

// ====== HTTP Request helper ======
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ====== رفع ملف واحد ======
function uploadFile(deployId, filePath, relPath, token) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(filePath);
    const urlPath = `/api/v1/deploys/${deployId}/files${relPath}`;

    const options = {
      hostname: 'api.netlify.com',
      path: urlPath,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

// ====== Main ======
async function deploy() {
  console.log('🚀 جاري رفع التطبيق على Netlify...\n');

  const files = getAllFiles(DIST_DIR);
  console.log(`📁 تم العثور على ${files.length} ملف`);

  // بناء file digest map
  const fileDigests = {};
  for (const f of files) {
    fileDigests[f.relPath] = f.sha1;
  }

  // 1. إنشاء deploy جديد (بدون token - anonymous)
  const createRes = await request({
    hostname: 'api.netlify.com',
    path: '/api/v1/sites',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  }, {});

  if (createRes.status !== 201 && createRes.status !== 200) {
    console.log('Site creation response:', createRes.status, JSON.stringify(createRes.body).slice(0, 200));
  }

  // استخدام Netlify Drop (بدون authentication)
  // نعمل zip للـ dist ونستخدم drop API
  const AdmZip = (() => {
    try { return require('adm-zip'); } catch { return null; }
  })();

  if (!AdmZip) {
    // طريقة بديلة: استخدام form-data upload
    console.log('\n⚠️  محتاج نثبت adm-zip أولاً...');
    console.log('شغّل الأمر ده:\n');
    console.log('  node node_modules/vite/bin/vite.js build');
    console.log('\nثم ارفع مجلد dist يدوياً على: https://app.netlify.com/drop');
    console.log('\n💡 أو اتبع الخطوات دي:');
    console.log('  1. افتح https://app.netlify.com/drop');
    console.log('  2. اسحب مجلد dist واتركه على الصفحة');
    console.log('  3. هيديك لينك فوراً!');
    return;
  }
}

// تشغيل بسيط - فقط اعرض الخطوات
console.log('');
console.log('═══════════════════════════════════════');
console.log('   🌐 رفع تطبيق الحكاية CRM');
console.log('═══════════════════════════════════════');
console.log('');
console.log('📦 مجلد dist جاهز في:');
console.log('   ' + path.join(__dirname, 'dist'));
console.log('');
console.log('🚀 الطريقة الأسرع (بدون login):');
console.log('   1. افتح: https://app.netlify.com/drop');
console.log('   2. اسحب مجلد dist من:');
console.log('      ' + path.join(__dirname, 'dist'));
console.log('   3. اتركه على الصفحة');
console.log('   4. هيديك لينك في ثواني! ✅');
console.log('');
console.log('═══════════════════════════════════════');
