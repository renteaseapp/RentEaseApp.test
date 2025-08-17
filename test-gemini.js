#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Google Gemini API');
console.log('============================');

// Read the .env.local file
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
  if (apiKeyMatch) {
    apiKey = apiKeyMatch[1].trim();
    console.log('✅ Found Gemini API key in .env.local');
    console.log('API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
  } else {
    console.log('❌ No Gemini API key found in .env.local');
    process.exit(1);
  }
} else {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

// Test the API
async function testGemini() {
  try {
    console.log('\n🔍 Testing Gemini API connection...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    });

    const result = await chat.sendMessage('สวัสดีครับ นี่คือข้อความทดสอบ');
    const response = result.response.text();

    console.log('✅ Gemini API test successful!');
    console.log('Response:', response);
    
  } catch (error) {
    console.log('❌ Gemini API test failed!');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      console.log('\n🔧 Troubleshooting API key error:');
      console.log('1. Check if your API key is valid at https://aistudio.google.com/app/apikey');
      console.log('2. Make sure you copied the entire API key');
      console.log('3. Try creating a new API key');
    } else if (error.message?.includes('quota')) {
      console.log('\n🔧 Troubleshooting quota error:');
      console.log('1. Check your usage at https://aistudio.google.com/app/apikey');
      console.log('2. Wait a few minutes and try again');
    }
  }
}

testGemini(); 