const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.jsx', 'utf8');

// Add to adminNavItems
// Also we might need an icon for it. E.g., HandCoins or Calculator. Let's use HandCoins or Percent.
// Let's import Percent from lucide-react.
code = code.replace(
   'import { LogOut, LayoutDashboard, CheckSquare, Package, PieChart, Wallet, Archive, Users, MoreHorizontal, X } from \'lucide-react\';',
   'import { LogOut, LayoutDashboard, CheckSquare, Package, PieChart, Wallet, Archive, Users, MoreHorizontal, X, Percent } from \'lucide-react\';'
);

code = code.replace(
   "{ path: '/archive', label: 'الأرشيف', icon: Archive },",
   "{ path: '/archive', label: 'الأرشيف', icon: Archive },\n    { path: '/profits', label: 'تقسيم الأرباح', icon: Percent },"
);

fs.writeFileSync('src/components/Layout.jsx', code);
