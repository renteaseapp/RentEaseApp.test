import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read both files
const en = JSON.parse(fs.readFileSync(join(__dirname, 'public/locales/en/ownerRentalDetailPage.json'), 'utf8'));
const th = JSON.parse(fs.readFileSync(join(__dirname, 'public/locales/th/ownerRentalDetailPage.json'), 'utf8'));

// Function to extract all keys recursively
const getAllKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = [...keys, ...getAllKeys(obj[key], fullKey)];
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

// Get all keys from both files
const enKeys = getAllKeys(en).sort();
const thKeys = getAllKeys(th).sort();

console.log('English keys count:', enKeys.length);
console.log('Thai keys count:', thKeys.length);

// Check for missing keys
const missingInTh = enKeys.filter(key => !thKeys.includes(key));
const missingInEn = thKeys.filter(key => !enKeys.includes(key));

console.log('\nMissing in Thai translation:');
console.log(missingInTh);

console.log('\nMissing in English translation:');
console.log(missingInEn);

console.log('\nStatus:');
if (missingInTh.length === 0 && missingInEn.length === 0) {
  console.log('✅ All keys match perfectly!');
} else {
  console.log('❌ Keys mismatch found');
}