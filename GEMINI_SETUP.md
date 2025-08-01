# 🔧 การตั้งค่า Google Gemini API

## 🎯 ข้อดีของ Google Gemini API

✅ **ฟรีสำหรับการใช้งานพื้นฐาน**
✅ **รองรับภาษาไทยได้ดี**
✅ **ไม่มี rate limit ที่เข้มงวด**
✅ **เสถียรและเชื่อถือได้**

## 📋 ขั้นตอนการตั้งค่า

### 1. สร้าง Google AI Studio Account
1. ไปที่ [Google AI Studio](https://aistudio.google.com/)
2. เข้าสู่ระบบด้วย Google Account
3. ไปที่ "Get API key" section

### 2. สร้าง API Key
1. คลิก "Create API Key"
2. เลือก "Create API Key in new project"
3. ตั้งชื่อ project (เช่น "RentEase AI Chat")
4. คัดลอก API Key ที่ได้

### 3. อัปเดต Environment File
แก้ไขไฟล์ `.env.local`:
```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
VITE_SOCKET_URL=https://renteaseapi-test.onrender.com
```

### 4. ทดสอบ API
```bash
npm run test-gemini
```

### 5. รันแอปพลิเคชัน
```bash
npm run dev
```

## 🔍 การแก้ไขปัญหา

### ถ้าได้ "API_KEY_INVALID":
- ตรวจสอบว่า API Key ถูกต้อง
- ตรวจสอบว่า API Key ยังไม่หมดอายุ
- ลองสร้าง API Key ใหม่

### ถ้าได้ "quota exceeded":
- ตรวจสอบการใช้งานใน Google AI Studio
- รอสักครู่แล้วลองใหม่

### ถ้าได้ "content policy":
- ข้อความของคุณถูกบล็อกโดยนโยบายความปลอดภัย
- ลองเปลี่ยนคำถามหรือข้อความ

## 📊 การใช้งาน

### Rate Limits:
- **ฟรี**: 15 requests per minute
- **ไม่มีการจำกัด** สำหรับการใช้งานปกติ

### Models ที่ใช้:
- **gemini-1.5-flash**: เร็วและประหยัด
- **gemini-1.5-pro**: คุณภาพสูงกว่า

## 🚀 ฟีเจอร์ที่เพิ่มเข้ามา

✅ **Client-side Rate Limiting**
✅ **Automatic Retry Logic**
✅ **Better Error Messages**
✅ **Thai Language Support**

## 📞 ข้อมูลเพิ่มเติม

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Key Management](https://aistudio.google.com/app/apikey) 