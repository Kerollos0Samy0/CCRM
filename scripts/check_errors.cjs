const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  await page.goto('https://crm-alhekaya.vercel.app/', { waitUntil: 'networkidle0' });
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (bodyHTML.includes('root') && bodyHTML.length < 500) {
      console.log('App is likely blank! Body HTML:', bodyHTML);
  } else {
      console.log('App seems to have rendered. Body length:', bodyHTML.length);
  }
  
  await browser.close();
})();
