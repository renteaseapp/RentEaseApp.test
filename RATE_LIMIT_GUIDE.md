# 🚦 Rate Limit Guide

## ✅ Good News!
Your API key is working! The 429 error means you've hit the rate limit, not an authentication issue.

## 🔍 Understanding Rate Limits

### What is Rate Limiting?
- OpenRouter limits how many requests you can make per minute
- Free accounts have lower limits than paid accounts
- This prevents abuse and ensures fair usage

### Common Rate Limits:
- **Free accounts**: ~10-20 requests per minute
- **Paid accounts**: Higher limits based on your plan
- **New accounts**: May have temporary restrictions

## 🛠️ What I've Added

### ✅ Client-Side Rate Limiting
- **1-second delay** between requests
- **10 requests per minute** maximum
- **Automatic retry** with exponential backoff
- **Better error messages** for rate limits

### ✅ Retry Logic
- Automatically retries failed requests
- Exponential backoff: 1s, 2s, 4s delays
- Maximum 3 retry attempts

## 🚀 How to Handle Rate Limits

### Immediate Solutions:
1. **Wait a minute** and try again
2. **Check your OpenRouter credits** at https://openrouter.ai/keys
3. **Upgrade your account** for higher limits

### Long-term Solutions:
1. **Add more credits** to your OpenRouter account
2. **Upgrade to a paid plan** for higher rate limits
3. **Implement server-side caching** to reduce API calls

## 📊 Monitoring Your Usage

### Check Your Credits:
1. Go to [OpenRouter Dashboard](https://openrouter.ai/keys)
2. Look at your credit balance
3. Check your usage history

### Understanding the Console:
```
Rate limiting: Waiting 1000ms before next request
Request count this minute: 3
Retrying in 2000ms (attempt 2/3)
```

## 🔧 Advanced Configuration

### Adjust Rate Limits:
Edit `services/aiChatService.ts`:
```typescript
private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds
private readonly MAX_REQUESTS_PER_MINUTE = 5; // 5 requests per minute
```

### Disable Rate Limiting (Not Recommended):
```typescript
// Comment out these lines in sendMessage method
// if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) { ... }
// if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) { ... }
```

## 📞 Need More Credits?

- **OpenRouter Free Credits**: New accounts get free credits
- **Upgrade Plan**: https://openrouter.ai/pricing
- **Contact Support**: support@openrouter.ai

## 🎯 Best Practices

1. **Don't spam requests** - Wait between messages
2. **Monitor your usage** - Check credits regularly
3. **Use caching** - Store common responses
4. **Implement fallbacks** - Handle rate limits gracefully

## 🚀 Next Steps

1. **Wait 1-2 minutes** before trying again
2. **Check your OpenRouter credits**
3. **Try sending a single message** to test
4. **Consider upgrading** if you need higher limits 