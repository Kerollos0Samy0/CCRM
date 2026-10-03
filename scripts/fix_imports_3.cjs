const fs = require('fs');
let code = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

const dataContextImportMatch = code.match(/import\s+\{[^}]+\}\s+from\s+["']\.\.\/context\/DataContext["'];/);
if (dataContextImportMatch) {
    code = code.replace(dataContextImportMatch[0], 'import { useData } from "../context/DataContext";');
}

fs.writeFileSync('src/pages/Analytics.jsx', code);
