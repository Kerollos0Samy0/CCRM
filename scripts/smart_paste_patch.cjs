const fs = require('fs');
let code = fs.readFileSync('src/components/OrderModal.jsx', 'utf8');

const regex = /const handleSmartPaste = \[\s\S\]*?setFormData\(newFormData\);\s*};/m;

// Because regex across multiple lines is tricky in JS sometimes, I'll use substring replacement.

const oldFuncStart = `  const handleSmartPaste = (e) => {`;
const oldFuncEnd = `    setFormData(newFormData);\n  };`;

const startIndex = code.indexOf(oldFuncStart);
const endIndex = code.indexOf(oldFuncEnd) + oldFuncEnd.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find handleSmartPaste");
  process.exit(1);
}

const newFunc = `  const handleSmartPaste = (e) => {
    const text = e.target.value;
    if (!text) return;

    const newFormData = { ...formData };
    
    const nameMatch = text.match(/(?:الاسم|اسم العميل)\\s*[:\\-]?\\s*([^\\n]+)/);
    if (nameMatch) newFormData.name = nameMatch[1].trim();
    
    const mobileMatch = text.match(/(?:الرقم|تليفون|موبايل|الموبايل|فون|رقم)\\s*[:\\-]?\\s*([\\d\\s]+)/);
    if (mobileMatch) newFormData.mobile = mobileMatch[1].trim();

    const govMatch = text.match(/المحافظة\\s*[:\\-]?\\s*([^\\n]+)/);
    if (govMatch) newFormData.governorate = govMatch[1].trim();

    const addressMatch = text.match(/العنوان\\s*[:\\-]?\\s*([^\\n]+)/);
    if (addressMatch) newFormData.address = addressMatch[1].trim();

    const churchMatch = text.match(/الكنيسة\\s*[:\\-]?\\s*([^\\n]+)/);
    if (churchMatch) newFormData.church = churchMatch[1].trim();

    const orderSectionMatch = text.match(/(?:الاوردر|الطلب|المطلوب|التفاصيل)\\s*[:\\-]?\\s*([\\s\\S]*?)(?:المدفوع|الخصم|$)/);
    let searchTarget = text;
    if (orderSectionMatch) {
      newFormData.orderNotes = orderSectionMatch[1].trim();
      searchTarget = orderSectionMatch[1].trim();
    }

    // Auto-detect products
    let detectedItems = [];
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
    let textRemaining = searchTarget;

    sortedProducts.forEach(product => {
      if (textRemaining.includes(product.name)) {
        let quantity = 1;
        const escapedName = product.name.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
        
        // Match numbers before or after
        const beforeRegex = new RegExp(\`(\\\\d+)\\\\s*(?:x|X|\\\\*|\\\\s)\\\\s*\${escapedName}\`, 'i');
        const afterRegex = new RegExp(\`\${escapedName}\\\\s*(?:عدد)?\\\\s*(\\\\d+)\`, 'i');
        
        const beforeMatch = textRemaining.match(beforeRegex);
        const afterMatch = textRemaining.match(afterRegex);
        
        if (beforeMatch) {
            quantity = parseInt(beforeMatch[1], 10);
            textRemaining = textRemaining.replace(beforeMatch[0], '');
        } else if (afterMatch) {
            quantity = parseInt(afterMatch[1], 10);
            textRemaining = textRemaining.replace(afterMatch[0], '');
        } else {
            textRemaining = textRemaining.replace(product.name, '');
        }
        
        detectedItems.push({
          workshop: product.name,
          quantity: quantity,
          unitPrice: product.sellPrice || 0,
          status: 'new'
        });
      }
    });

    if (detectedItems.length > 0) {
      newFormData.items = detectedItems;
    }

    const paidMatch = text.match(/(?:المدفوع|عربون|تم دفع|تم الدفع)\\s*[:\\-]?\\s*(\\d+)/);
    if (paidMatch) newFormData.paidAmount = parseInt(paidMatch[1], 10);

    const discountMatch = text.match(/(?:الخصم)\\s*[:\\-]?\\s*(\\d+)/);
    if (discountMatch) newFormData.discount = parseInt(discountMatch[1], 10);

    const deadlineMatch = text.match(/(?:الديد لاين|تاريخ التسليم|الديدلاين)\\s*[:\\-]?\\s*(\\d{4}-\\d{1,2}-\\d{1,2})/);
    if (deadlineMatch) {
      const parts = deadlineMatch[1].split('-');
      const yyyy = parts[0];
      const mm = parts[1].padStart(2, '0');
      const dd = parts[2].padStart(2, '0');
      newFormData.deadline = \`\${yyyy}-\${mm}-\${dd}\`;
    }

    setFormData(newFormData);
  };`;

code = code.substring(0, startIndex) + newFunc + code.substring(endIndex);

fs.writeFileSync('src/components/OrderModal.jsx', code);
console.log("Patched handleSmartPaste!");
