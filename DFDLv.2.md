# DFD Level 2 (RentEase Web)

> **หมายเหตุ:**
> - DFD Level 2 นี้แยกแต่ละโพรเซสหลักจาก DFDLv.1.md ออกเป็น subprocess ย่อย พร้อมอธิบาย data flow, entity, data store, และ interaction ย่อยในแต่ละ process อย่างละเอียด

---

## 1. สมัครสมาชิก/ล็อกอิน (User Registration & Login)
### Subprocess
- 1.1 กรอกข้อมูลสมัครสมาชิก (Guest → Register Form)
- 1.2 ตรวจสอบความถูกต้อง/ซ้ำของข้อมูล (Process → DS1: users)
- 1.3 สร้างบัญชีใหม่ (Process → DS1: users)
- 1.4 ส่งอีเมลยืนยัน/OTP (Process → External System)
- 1.5 ยืนยันอีเมล/OTP (User → Process → DS1: users)
- 1.6 กรอกข้อมูลล็อกอิน (Guest → Login Form)
- 1.7 ตรวจสอบรหัสผ่าน (Process → DS1: users)
- 1.8 สร้าง session/token (Process → User)
- 1.9 ลืมรหัสผ่าน/รีเซ็ต (User → Process → External System → DS1: users)

### Data Flow
- Guest → [สมัคร/ล็อกอิน/รีเซ็ต] → Process
- Process ↔ DS1: users (ตรวจสอบ/สร้าง/อัปเดต)
- Process → External System (ส่งอีเมล/OTP)
- User → [ยืนยัน/รีเซ็ต] → Process → DS1: users

---

## 2. ยืนยันตัวตน (ID Verification)
### Subprocess
- 2.1 กรอก/อัปโหลดเอกสาร (User → Form)
- 2.2 ตรวจสอบไฟล์/ข้อมูล (Process)
- 2.3 บันทึกไฟล์/สถานะ (Process → DS1: users)
- 2.4 แจ้งเตือนแอดมิน (Process → Admin)
- 2.5 แอดมินตรวจสอบ (Admin → Process)
- 2.6 อนุมัติ/ปฏิเสธ (Admin → Process → DS1: users)

### Data Flow
- User → [อัปโหลด] → Process → DS1: users
- Process → Admin (แจ้งเตือน)
- Admin → [ตรวจสอบ/อนุมัติ/ปฏิเสธ] → Process → DS1: users

---

## 3. ค้นหา/ดูสินค้า (Product Search & View)
### Subprocess
- 3.1 กรอก keyword/เลือก filter (User → Search Form)
- 3.2 ดึงหมวดหมู่/จังหวัด (Process → DS10: categories, DS2: products)
- 3.3 ดึงรายการสินค้า (Process → DS2: products)
- 3.4 แสดงผล/รายละเอียดสินค้า (Process → User)
- 3.5 ดูรายละเอียดสินค้า (User → Process → DS2: products)
- 3.6 ดูรีวิวสินค้า (User → Process → DS6: reviews)
- 3.7 เพิ่ม/ลบ wishlist (User → Process → DS14: wishlist)

### Data Flow
- User → [ค้นหา/เลือก filter] → Process
- Process ↔ DS2: products, DS10: categories, DS6: reviews, DS14: wishlist
- Process → User (แสดงผล)

---

## 4. สร้าง/แก้ไข/ลบสินค้า (Owner Listing Management)
### Subprocess
- 4.1 กรอกข้อมูลสินค้า (Owner → Form)
- 4.2 ตรวจสอบความถูกต้อง (Process)
- 4.3 บันทึก/อัปเดต/ลบสินค้า (Process → DS2: products)
- 4.4 แจ้งเตือนแอดมิน (Process → Admin)
- 4.5 แอดมินอนุมัติ/ปฏิเสธ (Admin → Process → DS2: products)

### Data Flow
- Owner → [สร้าง/แก้ไข/ลบ] → Process → DS2: products
- Process → Admin (แจ้งเตือน)
- Admin → [อนุมัติ/ปฏิเสธ] → Process → DS2: products

---

## 5. จองสินค้า (Rental Booking)
### Subprocess
- 5.1 เลือกสินค้า/กรอกข้อมูลเช่า (Renter → Form)
- 5.2 ตรวจสอบความพร้อม/คำนวณราคา (Process → DS2: products)
- 5.3 สร้าง rental (Process → DS3: rentals)
- 5.4 อัปเดตจำนวนสินค้า (Process → DS2: products)
- 5.5 แจ้งเตือนเจ้าของ (Process → Owner)
- 5.6 เจ้าของอนุมัติ/ปฏิเสธ (Owner → Process → DS3: rentals)

### Data Flow
- Renter → [จอง] → Process → DS3: rentals
- Process ↔ DS2: products
- Process → Owner (แจ้งเตือน)
- Owner → [อนุมัติ/ปฏิเสธ] → Process → DS3: rentals

---

## 6. ชำระเงิน (Payment)
### Subprocess
- 6.1 กรอกข้อมูล/อัปโหลดสลิป (Renter → Form)
- 6.2 ตรวจสอบ/บันทึกธุรกรรม (Process → DS4: payment_transactions)
- 6.3 อัปเดตสถานะ rental (Process → DS3: rentals)
- 6.4 แจ้งเตือนเจ้าของ/แอดมิน (Process → Owner/Admin)
- 6.5 เจ้าของ/แอดมินตรวจสอบ/ยืนยัน (Owner/Admin → Process → DS3: rentals, DS4: payment_transactions)
- 6.6 แจ้งเตือนผล (Process → Renter)

### Data Flow
- Renter → [ชำระเงิน/อัปโหลดสลิป] → Process → DS4: payment_transactions
- Process → DS3: rentals (อัปเดตสถานะ)
- Process → Owner/Admin (แจ้งเตือน)
- Owner/Admin → [ตรวจสอบ/ยืนยัน] → Process → DS3: rentals, DS4: payment_transactions

---

## 7. การรับ-คืนสินค้า (Pickup/Return)
### Subprocess
- 7.1 แจ้งรับสินค้า (Renter/Owner → Process → DS3: rentals)
- 7.2 อัปเดตสถานะ/เวลา (Process → DS3: rentals)
- 7.3 แจ้งคืนสินค้า (Renter/Owner → Process → DS3: rentals)
- 7.4 อัปเดตจำนวนสินค้า (Process → DS2: products)
- 7.5 อัปโหลดหลักฐาน/โน้ต (Renter/Owner → Process → DS3: rentals)

### Data Flow
- Renter/Owner → [แจ้งรับ/คืน] → Process → DS3: rentals
- Process → DS2: products (อัปเดตจำนวน)

---

## 8. แชท (Chat)
### Subprocess
- 8.1 สร้าง/ค้นหาห้องสนทนา (User → Process → DS5: chat_conversations)
- 8.2 ส่งข้อความ/ไฟล์ (User → Process → DS5: chat_messages)
- 8.3 รับข้อความ/แจ้งเตือน (Process → User)
- 8.4 อัปเดตสถานะอ่าน (User → Process → DS5: chat_messages)

### Data Flow
- User → [ส่งข้อความ/ไฟล์] → Process → DS5: chat_conversations, chat_messages
- Process → User (Realtime/แจ้งเตือน)

---

## 9. รีวิว (Review)
### Subprocess
- 9.1 ให้คะแนน/คอมเมนต์ (Renter/Owner → Form)
- 9.2 ตรวจสอบสิทธิ์/สถานะ (Process → DS3: rentals)
- 9.3 บันทึกรีวิว (Process → DS6: reviews)
- 9.4 อัปเดตสถานะ rental (Process → DS3: rentals)

### Data Flow
- Renter/Owner → [รีวิว] → Process → DS6: reviews
- Process → DS3: rentals (อัปเดตสถานะ reviewed)

---

## 10. ร้องเรียน/แจ้งปัญหา (Complaint)
### Subprocess
- 10.1 กรอกข้อมูลร้องเรียน (User → Form)
- 10.2 ตรวจสอบ/บันทึก (Process → DS7: complaints)
- 10.3 แจ้งเตือนแอดมิน (Process → Admin)
- 10.4 แอดมินตรวจสอบ/ตอบกลับ/ปิดเรื่อง (Admin → Process → DS7: complaints)
- 10.5 อัปเดตสถานะ/บันทึกผล (Process → DS7: complaints)

### Data Flow
- User → [ร้องเรียน] → Process → DS7: complaints
- Process → Admin (แจ้งเตือน)
- Admin → [ตรวจสอบ/ตอบกลับ/ปิดเรื่อง] → Process → DS7: complaints

---

## 11. การเคลม (Claim)
### Subprocess
- 11.1 แจ้งเคลม (Owner → Form)
- 11.2 ตรวจสอบ/บันทึก (Process → DS8: claims)
- 11.3 แจ้งเตือนแอดมิน (Process → Admin)
- 11.4 แอดมินตรวจสอบ/ตัดสิน (Admin → Process → DS8: claims)
- 11.5 อัปเดตสถานะ/ผล (Process → DS8: claims)

### Data Flow
- Owner → [แจ้งเคลม] → Process → DS8: claims
- Process → Admin (แจ้งเตือน)
- Admin → [ตรวจสอบ/ตัดสิน] → Process → DS8: claims

---

## 12. Wishlist (เพิ่ม/ลบสินค้าที่ถูกใจ)
### Subprocess
- 12.1 เพิ่มสินค้าใน wishlist (User → Process → DS14: wishlist)
- 12.2 ลบสินค้าออกจาก wishlist (User → Process → DS14: wishlist)
- 12.3 ตรวจสอบสถานะ wishlist (User → Process → DS14: wishlist)

### Data Flow
- User → [เพิ่ม/ลบ/ตรวจสอบ] → Process → DS14: wishlist

---

## 13. การจัดการโดยแอดมิน (Admin Management)
### Subprocess
- 13.1 จัดการผู้ใช้ (Admin → Process → DS1: users, DS9: admin_users)
  - 13.1.1 ค้นหา/ดู/แก้ไข/ลบผู้ใช้
  - 13.1.2 แบน/ปลดแบนผู้ใช้
  - 13.1.3 ตรวจสอบ/อนุมัติยืนยันตัวตน
- 13.2 จัดการสินค้า (Admin → Process → DS2: products, DS10: categories)
  - 13.2.1 ค้นหา/ดู/แก้ไข/ลบสินค้า
  - 13.2.2 อนุมัติ/ปฏิเสธสินค้าใหม่
  - 13.2.3 จัดการหมวดหมู่
- 13.3 จัดการร้องเรียน/เคลม (Admin → Process → DS7: complaints, DS8: claims)
  - 13.3.1 ตรวจสอบ/ตอบกลับ/ปิดเรื่องร้องเรียน
  - 13.3.2 ตรวจสอบ/ตัดสินเคลม
- 13.4 ดูรายงาน/สถิติ (Admin → Process → DS1, DS2, DS3, DS4, DS7, DS8)
  - 13.4.1 ดูรายงานผู้ใช้, สินค้า, การเช่า, รายได้, ร้องเรียน, เคลม
- 13.5 ตั้งค่าระบบ (Admin → Process → DS11: system_settings)
  - 13.5.1 ดู/แก้ไขค่าระบบ
- 13.6 จัดการเนื้อหาคงที่ (Admin → Process → DS12: static_pages)
  - 13.6.1 ดู/แก้ไขเนื้อหา About, FAQ, ToS ฯลฯ

### Data Flow
- Admin → [จัดการ] → Process → Data Store ตามแต่ละฟีเจอร์

---

> **DFD Level 2 นี้ครอบคลุม subprocess และ data flow ย่อยของแต่ละ process หลักในระบบ RentEase Web อย่างละเอียด** 