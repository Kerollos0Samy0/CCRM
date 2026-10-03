const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://al-hekaya-strefqa.vercel.app/workshop-orders-7f8b9/', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for the data to load. We look for order cards or a container.
    await new Promise(r => setTimeout(r, 8000)); // Give it some time to fetch API data and render

    // Extract data
    const extractedData = await page.evaluate(() => {
       const cols = {};
       const orders = {};
       let stats = {};
       
       // Try to extract statistics if available
       // (Depending on the DOM structure)
       const statEls = document.querySelectorAll('.stat-card, .statistic, [class*="stat"]');
       statEls.forEach(el => {
           stats[el.innerText.trim()] = true;
       });

       // Look for columns
       const columnElements = document.querySelectorAll('.column, [data-rbd-droppable-id], [class*="column"], .BoardColumn');
       columnElements.forEach((col, colIndex) => {
           const titleEl = col.querySelector('h2, h3, .column-title, [class*="title"]');
           const title = titleEl ? titleEl.innerText.trim() : `Column_${colIndex}`;
           let colId = col.getAttribute('data-rbd-droppable-id') || col.id || `col_${colIndex}`;
           
           cols[colId] = { id: colId, title, orderIds: [] };
           
           const cardElements = col.querySelectorAll('.card, [data-rbd-draggable-id], [class*="card"], .OrderCard');
           cardElements.forEach((card, cardIndex) => {
               const orderId = card.getAttribute('data-rbd-draggable-id') || card.id || `order_${colId}_${cardIndex}`;
               cols[colId].orderIds.push(orderId);
               
               orders[orderId] = {
                   id: orderId,
                   rawText: card.innerText.trim(),
                   status: colId,
                   // Extract elements like name, church, items, price etc if possible
               };
               
               // Try to extract specific fields based on common patterns
               const textLines = card.innerText.split('\n').map(l => l.trim()).filter(l => l);
               orders[orderId].lines = textLines;
           });
       });
       
       // If the site uses localStorage, we might be able to just dump it!
       const ls = { ...localStorage };
       
       return { cols, orders, stats, ls };
    });
    
    fs.writeFileSync('scraped_data.json', JSON.stringify(extractedData, null, 2));
    console.log(`Scraped ${Object.keys(extractedData.orders).length} orders from UI.`);
    console.log(`LocalStorage dump keys: ${Object.keys(extractedData.ls).join(', ')}`);
    
  } catch(e) {
    console.error('Error scraping:', e);
  } finally {
    await browser.close();
  }
})();
