const https = require('https');
const fs = require('fs');

function fetchUrl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, dest));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => reject(err));
  });
}

fetchUrl('https://docs.google.com/spreadsheets/d/1qLw0Md1-A9x8Vj_FWg_2B4j_cUOGTAmNTsdoASzvx-c/htmlview?gid=0', 'orders_export.html')
  .then(() => console.log('Downloaded'))
  .catch(console.error);
