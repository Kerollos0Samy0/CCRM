const fs = require('fs');
let code = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');
code = code.replace("import { motion } from 'framer-motion';", "");
code = code.replace('import { motion } from "framer-motion";', "");
fs.writeFileSync('src/pages/Analytics.jsx', code);
