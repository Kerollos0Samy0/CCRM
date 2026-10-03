const fs = require('fs');
const crypto = require('crypto');

const data = `ProductName	Type	شراء	بيع
Bible Note	Brand	12	30
Basic Note	Brand	16	18
Todo List	Brand	10	23
Tracker Note	Brand	12	30
كارت حضور 4	Workshop	1	3
كارت حضور 5	Workshop	1	4
كارت حضور 8	Workshop	1	5
كارت حضور 12	Workshop	1	5
كارت حضور العدراء	Workshop	1	5
ختم حضور	Workshop	50	100
باكيدچ	Workshop	1450	2000
File	Digital	0	100
أسبوع الالام	Workshop	30	80
استيكر اسبوع الالام	Workshop	10	20
أحاد الصوم	Workshop	30	80
استيكر أحاد الصوم	Workshop	10	20
القيامة ابتدائي	Workshop	30	80
استيكر القيامة ابتدائي	Workshop	10	20
القيامة شباب	Workshop	30	80
أستيكر القيامة شباب	Workshop	10	20
القيامة فردية 300جرام	Workshop	9	15
القيامة فردية 150جرام	Workshop	8	12
القيامة فردية 80جرام	Workshop	5	9
أيات يونان	Workshop	50	100
أسفار الكتاب المقدس	Workshop	650	850
خيمة الاجتماع	Workshop	30	80
أحاد الخماسين	Workshop	30	80
رحلات بولس خشب	Workshop	200	400
رحلات بولس ورق	Workshop	130	200
رحلات بولس خرايط	Workshop	100	200
استيكر خيمة الاجتماع	Workshop	10	20
استيكر خماسين	Workshop	10	20
الخروج	Workshop	50	80
اختام الرؤيا	Workshop	50	100
الروح القدس	Workshop	30	80
قضاه	Workshop	30	80
ملوك	Workshop	30	80
اعمال الرسل	Workshop	70	120
خريطة البشارة	Workshop	30	80
خريطة بداية الخدمة	Workshop	30	80
خريطة الخدمة الاولي	Workshop	30	80
الخليقة ابتدائي	Workshop	50	100
حامل الايقونات 	Workshop	50	80
خيمة الاجتماع فردي 	Workshop	8	15
حامل الايقونات  فردي	Workshop	8	15
عمل الفلك	Workshop	6	11
ابطال ١ 	Workshop	80	120
حظاظة 	Workshop	5	7
الخليقة فردية	Workshop	15	20
ورشة يعقوب	Workshop	30	80
قصة تلوين	Workshop	20	50`;

const lines = data.trim().split('\n').slice(1);
const products = lines.map(line => {
  const [name, type, buy, sell] = line.split('\t');
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    type: type.trim(),
    buyPrice: Number(buy.trim()),
    sellPrice: Number(sell.trim()),
    stock: 0
  };
});

fs.writeFileSync('src/data/products.json', JSON.stringify(products, null, 2));
console.log('Done!');
