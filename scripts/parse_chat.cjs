const fs = require('fs');
const txt = fs.readFileSync('./temp_chat/WhatsApp Chat with أوردرات ورشة الحكاية 🥰.txt', 'utf8');

const clientsMap = new Map();

// Regex to capture the body of a message sent by someone
// A message starts with "M/D/YY, H:MM [AM|PM] - Name:" or "M/D/YY, HH:MM - Name:"
const messageRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?\s-\s([^:]+):\s([\s\S]*?)(?=(^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?\s-\s)|$)/gm;

let match;
while ((match = messageRegex.exec(txt)) !== null) {
  const body = match[2];

  let name = '';
  let phone = '';
  let address = '';
  let church = '';
  let governorate = '';

  const nameMatch = body.match(/(?:الاسم|الاسم :|الاسم:|الاسم\s)\s*([^\n]+)/);
  if (nameMatch) name = nameMatch[1].trim();

  const phoneMatch = body.match(/(?:رقم التليفون|رقم ت|التليفون|الموبايل|رقم الموبايل|تليفون|رقم)\s*[:\-]?\s*([0-9\s]+)/);
  if (phoneMatch) phone = phoneMatch[1].replace(/\s/g, '').trim();

  const addressMatch = body.match(/العنوان\s*[:\-]?\s*([^\n]+)/);
  if (addressMatch) address = addressMatch[1].trim();

  const churchMatch = body.match(/(?:كنيسة|كنيسه|الكنيسة|الكنيسه)\s*[:\-]?\s*([^\n]+)/);
  if (churchMatch) church = churchMatch[1].trim();

  const govMatch = body.match(/(?:محافظة|محافظه|المحافظة|المحافظه)\s*[:\-]?\s*([^\n]+)/);
  if (govMatch) governorate = govMatch[1].trim();

  if (!name) {
    const lines = body.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length >= 2) {
      const maybePhoneMatch = lines[1].match(/^01[0-9]{9}$/);
      if (maybePhoneMatch && !lines[0].includes(' ')) {
         name = lines[0];
         phone = lines[1];
      }
    }
  }

  if (name) {
     name = name.replace(/<This message was edited>/g, '').trim();
     
     // Skip simple names like just "ام" or "ابونا" without context if possible, but let's keep it simple
     if (name.length < 2) continue;

     const key = name.toLowerCase();
     if (!clientsMap.has(key)) {
         clientsMap.set(key, { name, phone, address, church, governorate });
     } else {
         const existing = clientsMap.get(key);
         if (!existing.phone && phone) existing.phone = phone;
         if (!existing.address && address) existing.address = address;
         if (!existing.church && church) existing.church = church;
         if (!existing.governorate && governorate) existing.governorate = governorate;
     }
  }
}

const clients = Array.from(clientsMap.values());
fs.writeFileSync('./src/data/clients_from_chat.json', JSON.stringify(clients, null, 2));
console.log('Found ' + clients.length + ' clients.');
