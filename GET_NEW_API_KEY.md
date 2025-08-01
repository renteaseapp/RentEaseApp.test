# 🔑 How to Get a New OpenRouter API Key

## Step-by-Step Guide

### 1. Go to OpenRouter
Visit [https://openrouter.ai/](https://openrouter.ai/)

### 2. Sign Up/Login
- If you don't have an account, click "Sign Up"
- If you have an account, click "Login"

### 3. Get Your API Key
1. After logging in, go to your dashboard
2. Click on "API Keys" or "Keys" in the navigation
3. Click "Create New Key" or "Generate API Key"
4. Give your key a name (e.g., "RentEase AI Chat")
5. Copy the generated API key (it should start with `sk-or-v1-`)

### 4. Update Your Environment File
Replace the API key in your `.env.local` file:

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your_new_api_key_here
VITE_SOCKET_URL=https://renteaseapi-test.onrender.com
```

### 5. Test the New Key
Run this command to test your new API key:
```bash
npm run test-api
```

### 6. Restart Your Development Server
```bash
npm run dev
```

## 🔧 Troubleshooting

### If you get "No credits" error:
1. Go to your OpenRouter dashboard
2. Check your credit balance
3. Add credits if needed (OpenRouter offers free credits for new users)

### If you get "Invalid API key" error:
1. Make sure you copied the entire API key
2. Check that it starts with `sk-or-v1-`
3. Try generating a new key

### If you get "Rate limit exceeded":
1. Wait a few minutes and try again
2. Check your usage limits in the dashboard

## 📞 Need Help?

- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter Discord: https://discord.gg/openrouter
- OpenRouter Support: support@openrouter.ai 