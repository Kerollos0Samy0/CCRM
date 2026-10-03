const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('https://crm-alhekaya.vercel.app/', { waitUntil: 'networkidle0', timeout: 60000 });
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  const localStorageDump = await page.evaluate(() => JSON.stringify(localStorage));
  
  console.log('App loaded. Body length:', bodyHTML.length);
  if (bodyHTML.length < 1000) {
     console.log('Body HTML:', bodyHTML);
  }
  fs.writeFileSync('dump_localstorage.json', localStorageDump);
  
  await browser.close();
})();
