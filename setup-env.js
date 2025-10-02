#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 RentEase AI Chat Setup Helper');
console.log('================================');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local file already exists!');
  console.log('Please check if VITE_OPENROUTER_API_KEY is properly configured.');
  console.log('Current content:');
  console.log('----------------');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('----------------');
} else {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# OpenRouter API Configuration
# Get your API key from: https://openrouter.ai/
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Socket URL (if needed)
VITE_SOCKET_URL=https://renteaseapi2.onrender.com
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Get your OpenRouter API key from https://openrouter.ai/');
  console.log('2. Replace "your_openrouter_api_key_here" with your actual API key');
  console.log('3. Restart your development server: npm run dev');
  console.log('');
  console.log('📖 For detailed instructions, see AI_CHAT_SETUP.md');
}

console.log('');
console.log('🔗 Useful links:');
console.log('- OpenRouter: https://openrouter.ai/');
console.log('- Setup Guide: AI_CHAT_SETUP.md'); 