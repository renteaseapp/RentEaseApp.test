# การตั้งค่า AI Chat Assistant

## 1. การตั้งค่า OpenRouter API Key

### ขั้นตอนที่ 1: สมัคร OpenRouter
1. ไปที่ [OpenRouter](https://openrouter.ai/)
2. สมัครสมาชิกและสร้าง API Key
3. เลือก Model ที่ต้องการใช้ (ปัจจุบันใช้: `google/gemini-2.0-flash-exp:free`)

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค:

```env
# OpenRouter API Configuration
REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Socket URL (ถ้ามี)
VITE_SOCKET_URL=https://renteaseapi-test.onrender.com
```

**หมายเหตุ:** แทนที่ `your_openrouter_api_key_here` ด้วย API Key จริงจาก OpenRouter

## 2. ฟีเจอร์ของ AI Chat Assistant

### ฟีเจอร์หลัก:
- **Chat Interface:** Popup ด้านขวาของหน้าจอ
- **Real-time Chat:** ส่งข้อความและรับคำตอบทันที
- **Context Awareness:** AI รู้จักระบบ RentEase และสามารถช่วยเหลือได้
- **Responsive Design:** ใช้งานได้ทั้งมือถือและเดสก์ท็อป
- **Error Handling:** จัดการข้อผิดพลาดและแสดงข้อความที่เหมาะสม

### การใช้งาน:
1. **เปิด Chat:** คลิกปุ่ม AI Assistant ใน Navbar
2. **ส่งข้อความ:** พิมพ์ข้อความและกด Enter หรือคลิกปุ่มส่ง
3. **ปิด Chat:** คลิกปุ่ม X หรือคลิกนอก Chat window
4. **ล้าง Chat:** คลิกปุ่ม Trash เพื่อล้างประวัติการสนทนา

### ตัวอย่างคำถามที่ AI สามารถตอบได้:
- "วิธีการเช่าสินค้าทำอย่างไร?"
- "ขั้นตอนการสมัครสมาชิกมีอะไรบ้าง?"
- "วิธีการเป็นผู้ให้เช่าสินค้าทำอย่างไร?"
- "ระบบการชำระเงินมีวิธีไหนบ้าง?"
- "วิธีการแก้ไขปัญหาการใช้งานระบบ"

## 3. การปรับแต่ง

### เปลี่ยน AI Model:
แก้ไขใน `services/aiChatService.ts`:

```typescript
model: 'google/gemini-2.0-flash-exp:free', // เปลี่ยนเป็น model อื่น
```

### เปลี่ยน System Prompt:
แก้ไขใน `services/aiChatService.ts`:

```typescript
const SYSTEM_PROMPT = `ข้อความ prompt ใหม่`;
```

### เปลี่ยน UI Design:
แก้ไขใน `components/common/AIChatWidget.tsx`

## 4. การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

1. **API Key ไม่ถูกต้อง**
   - ตรวจสอบว่า API Key ถูกต้องและมีเครดิตเพียงพอ
   - ตรวจสอบไฟล์ `.env.local`

2. **Chat ไม่เปิด**
   - ตรวจสอบว่า AIChatProvider ถูกเพิ่มใน App.tsx
   - ตรวจสอบ Console สำหรับ Error

3. **ข้อความไม่ส่ง**
   - ตรวจสอบ Network connection
   - ตรวจสอบ API Key และ Model ที่ใช้

## 5. การพัฒนาเพิ่มเติม

### ความเป็นไปได้ในการพัฒนาต่อ:
- **File Upload:** อัปโหลดรูปภาพหรือไฟล์
- **Voice Chat:** สนทนาด้วยเสียง
- **Multi-language:** รองรับหลายภาษา
- **Chat History:** บันทึกประวัติการสนทนา
- **Integration:** เชื่อมต่อกับระบบอื่นๆ

## 6. Security Considerations

- API Key ควรเก็บใน Environment Variables เท่านั้น
- ไม่ควรเปิดเผย API Key ใน Client-side code
- ควรใช้ Rate Limiting เพื่อป้องกันการใช้งานเกินขีดจำกัด
- ควรมีการ Validate ข้อมูลที่ส่งไปยัง AI API 