const fs = require('fs');

const html = fs.readFileSync('orders_export.html', 'utf8');

// 1. Parse styles
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
const styles = styleMatch ? styleMatch[1] : '';

const classColorMap = {};
const styleRegex = /\.s(\d+)\{([^}]*)\}/g;
let m;
while ((m = styleRegex.exec(styles)) !== null) {
  const className = `s${m[1]}`;
  const props = m[2];
  const bgMatch = props.match(/background-color:\s*([^;]+)/);
  if (bgMatch) {
    classColorMap[className] = bgMatch[1].trim().toLowerCase();
  }
}

// 2. Parse table rows
const rows = [];
const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
let rMatch;
while ((rMatch = rowRegex.exec(html)) !== null) {
  const rowHtml = rMatch[1];
  const cells = [];
  const cellRegex = /<td[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/td>/g;
  let cMatch;
  let rowColorClass = null;
  while ((cMatch = cellRegex.exec(rowHtml)) !== null) {
    if (!rowColorClass) {
      const cls = cMatch[1].split(' ').find(c => c.startsWith('s'));
      rowColorClass = cls;
    }
    // Remove tags and decode HTML entities roughly
    let text = cMatch[2].replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').trim();
    cells.push(text);
  }
  
  if (cells.length > 0) {
    const bgColor = classColorMap[rowColorClass] || '#ffffff';
    rows.push({ cells, bgColor, rowColorClass });
  }
}

console.log(`Found ${rows.length} rows.`);

// Print the first 50 rows to see data and colors
rows.slice(0, 50).forEach((r, i) => {
  console.log(`Row ${i}: Color: ${r.bgColor} (${r.rowColorClass}) - ${r.cells.join(' | ').substring(0, 100)}`);
});
