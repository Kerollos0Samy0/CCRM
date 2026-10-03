const fs = require('fs');
let code = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

// Fix DataContext import
code = code.replace(
   'import { TrendingUp, FileText, ShoppingCart, ChevronDown, ChevronUp, useData } from "../context/DataContext";',
   'import { useData } from "../context/DataContext";'
);

// Add to lucide-react import
code = code.replace(
   'import { Package, CheckCircle, TrendingUp, DollarSign, Map, MapPin, Star, BarChart } from "lucide-react";',
   'import { Package, CheckCircle, TrendingUp, DollarSign, Map, MapPin, Star, BarChart, FileText, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";'
);

fs.writeFileSync('src/pages/Analytics.jsx', code);
