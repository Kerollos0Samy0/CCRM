const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add import
code = code.replace(
   "import Clients from './pages/Clients';",
   "import Clients from './pages/Clients';\nimport ProfitSharing from './pages/ProfitSharing';"
);

// Add Route
code = code.replace(
   '<Route path="/archive" element={<ProtectedRoute><Layout><Archive /></Layout></ProtectedRoute>} />',
   '<Route path="/archive" element={<ProtectedRoute><Layout><Archive /></Layout></ProtectedRoute>} />\n      <Route path="/profits" element={<ProtectedRoute><Layout><ProfitSharing /></Layout></ProtectedRoute>} />'
);

fs.writeFileSync('src/App.jsx', code);
