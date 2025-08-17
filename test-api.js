#!/usr/bin/env node

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing OpenRouter API Key with OpenAI SDK');
console.log('=============================================');

// Read the .env.local file
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/VITE_OPENROUTER_API_KEY=(.+)/);
  if (apiKeyMatch) {
    apiKey = apiKeyMatch[1].trim();
    console.log('✅ Found API key in .env.local');
    console.log('API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
  } else {
    console.log('❌ No API key found in .env.local');
    process.exit(1);
  }
} else {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

// Test the API
async function testAPI() {
  try {
    console.log('\n🔍 Testing API connection with OpenAI SDK...');
    
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for browser environments
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'RentEase AI Assistant Test',
      },
    });

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message.',
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    console.log('✅ API test successful!');
    console.log('Response:', completion.choices[0].message);
    console.log('Usage:', completion.usage);
    
  } catch (error) {
    console.log('❌ API test failed!');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error status:', error.status);
    console.log('Error code:', error.code);
    
    if (error.status === 401) {
      console.log('\n🔧 Troubleshooting 401 error:');
      console.log('1. Check if your API key is valid at https://openrouter.ai/');
      console.log('2. Make sure you have credits in your OpenRouter account');
      console.log('3. Verify the API key format starts with "sk-or-v1-"');
    }
  }
}

testAPI(); 