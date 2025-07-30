# DFD Level 1 (RentEase Web)

## 1. External Entities (เอนทิตี้ภายนอก)
- **ผู้ใช้ทั่วไป (Guest)**: บุคคลที่ยังไม่ได้สมัคร/ล็อกอิน
- **ผู้เช่า (Renter)**: ผู้ใช้ที่เช่าสินค้า
- **เจ้าของสินค้า (Owner)**: ผู้ใช้ที่ปล่อยสินค้าให้เช่า
- **แอดมิน (Admin)**: ผู้ดูแลระบบ
- **ระบบภายนอก (External System)**: เช่น ระบบอีเมล, ระบบชำระเงิน, ระบบแจ้งเตือน

## 2. Data Stores (แหล่งเก็บข้อมูล)
- **DS1: users** (ข้อมูลผู้ใช้)
- **DS2: products** (ข้อมูลสินค้า)
- **DS3: rentals** (ข้อมูลการเช่า)
- **DS4: payment_transactions** (ธุรกรรมการเงิน)
- **DS5: chat_conversations, chat_messages** (แชท)
- **DS6: reviews** (รีวิว)
- **DS7: complaints** (ร้องเรียน)
- **DS8: claims** (เคลม)
- **DS9: admin_users** (ข้อมูลแอดมิน)
- **DS10: categories** (หมวดหมู่สินค้า)
- **DS11: system_settings** (ตั้งค่าระบบ)
- **DS12: user_addresses** (ที่อยู่ผู้ใช้)
- **DS13: notifications** (แจ้งเตือน)
- **DS14: wishlist** (สินค้าที่ถูกใจ)

## 3. Processes (โพรเซส)

### 3.1 สมัครสมาชิก/ล็อกอิน (User Registration & Login)
- **External Entity:** Guest
- **Data Flow:**
  - Guest → [สมัคร/ล็อกอิน] → Process 1: Auth
  - Process 1: Auth → DS1: users (อ่าน/เขียน)
  - Process 1: Auth → ระบบภายนอก (ส่งอีเมลยืนยัน/OTP)
- **รายละเอียด:**
  - รับข้อมูลสมัคร/ล็อกอิน
  - ตรวจสอบ/บันทึก users
  - ส่งอีเมลยืนยัน/OTP

### 3.2 ยืนยันตัวตน (ID Verification)
- **External Entity:** User (Renter/Owner)
- **Data Flow:**
  - User → [อัปโหลดเอกสาร] → Process 2: ID Verification
  - Process 2 → DS1: users (อัปเดตสถานะ/ไฟล์)
  - Process 2 → Admin (แจ้งเตือนตรวจสอบ)
  - Admin → [อนุมัติ/ปฏิเสธ] → Process 2
  - Process 2 → DS1: users (อัปเดตสถานะ)
- **รายละเอียด:**
  - ผู้ใช้ส่งเอกสาร, ระบบบันทึก, แจ้งแอดมินตรวจสอบ
  - แอดมินอนุมัติ/ปฏิเสธ, อัปเดตสถานะ

### 3.3 ค้นหา/ดูสินค้า (Product Search & View)
- **External Entity:** Guest/User
- **Data Flow:**
  - Guest/User → [ค้นหา/ดูสินค้า] → Process 3: Product Search/View
  - Process 3 → DS2: products, DS10: categories (อ่าน)
- **รายละเอียด:**
  - รับ keyword/filters, ดึงข้อมูลสินค้า/หมวดหมู่

### 3.4 สร้าง/แก้ไข/ลบสินค้า (Owner Listing Management)
- **External Entity:** Owner
- **Data Flow:**
  - Owner → [สร้าง/แก้ไข/ลบ] → Process 4: Product Management
  - Process 4 → DS2: products (เขียน/อัปเดต/ลบ)
  - Process 4 → DS10: categories (อ่าน)
  - Process 4 → Admin (แจ้งเตือนรออนุมัติ)
  - Admin → [อนุมัติ/ปฏิเสธ] → Process 4
  - Process 4 → DS2: products (อัปเดตสถานะ)
- **รายละเอียด:**
  - เจ้าของสร้าง/แก้ไข/ลบสินค้า, รอแอดมินอนุมัติ

### 3.5 จองสินค้า (Rental Booking)
- **External Entity:** Renter
- **Data Flow:**
  - Renter → [เลือกสินค้า/กรอกข้อมูล] → Process 5: Booking
  - Process 5 → DS3: rentals (สร้าง)
  - Process 5 → DS2: products (อ่าน/อัปเดตจำนวนว่าง)
  - Process 5 → Owner (แจ้งเตือนรออนุมัติ)
  - Owner → [อนุมัติ/ปฏิเสธ] → Process 5
  - Process 5 → DS3: rentals (อัปเดตสถานะ)
- **รายละเอียด:**
  - ผู้เช่ากรอกข้อมูล, ระบบสร้าง rental, แจ้งเจ้าของ, เจ้าของอนุมัติ/ปฏิเสธ

### 3.6 ชำระเงิน (Payment)
- **External Entity:** Renter
- **Data Flow:**
  - Renter → [อัปโหลดสลิป/ชำระเงิน] → Process 6: Payment
  - Process 6 → DS4: payment_transactions (สร้าง)
  - Process 6 → DS3: rentals (อัปเดตสถานะ)
  - Process 6 → ระบบภายนอก (Payment Gateway)
  - Owner/Admin → [ตรวจสอบ/ยืนยัน] → Process 6
  - Process 6 → DS3: rentals, DS4: payment_transactions (อัปเดตสถานะ)
- **รายละเอียด:**
  - ผู้เช่าชำระเงิน, ระบบบันทึกธุรกรรม, แจ้งเจ้าของ/แอดมินตรวจสอบ

### 3.7 การรับ-คืนสินค้า (Pickup/Return)
- **External Entity:** Renter/Owner
- **Data Flow:**
  - Renter/Owner → [แจ้งรับ/คืน] → Process 7: Pickup/Return
  - Process 7 → DS3: rentals (อัปเดตสถานะ/เวลา)
  - Process 7 → DS2: products (อัปเดตจำนวนว่าง)
- **รายละเอียด:**
  - แจ้งรับ/คืน, ระบบอัปเดตสถานะ rental และสินค้า

### 3.8 แชท (Chat)
- **External Entity:** User (Renter/Owner)
- **Data Flow:**
  - User → [ส่งข้อความ] → Process 8: Chat
  - Process 8 → DS5: chat_conversations, chat_messages (อ่าน/เขียน)
  - Process 8 → User (Realtime/แจ้งเตือน)
- **รายละเอียด:**
  - ส่งข้อความ, แนบไฟล์, แจ้งเตือนแบบ realtime

### 3.9 รีวิว (Review)
- **External Entity:** Renter/Owner
- **Data Flow:**
  - Renter/Owner → [ให้คะแนน/คอมเมนต์] → Process 9: Review
  - Process 9 → DS6: reviews (สร้าง)
  - Process 9 → DS3: rentals (อัปเดตสถานะ reviewed)
- **รายละเอียด:**
  - ให้คะแนน/คอมเมนต์หลังเช่าเสร็จ

### 3.10 ร้องเรียน/แจ้งปัญหา (Complaint)
- **External Entity:** User (Renter/Owner)
- **Data Flow:**
  - User → [ส่งเรื่องร้องเรียน] → Process 10: Complaint
  - Process 10 → DS7: complaints (สร้าง)
  - Process 10 → Admin (แจ้งเตือน)
  - Admin → [ตรวจสอบ/ตอบกลับ/ปิดเรื่อง] → Process 10
  - Process 10 → DS7: complaints (อัปเดตสถานะ/บันทึกผล)
- **รายละเอียด:**
  - ผู้ใช้ร้องเรียน, แอดมินตรวจสอบ, ตอบกลับ, ปิดเรื่อง

### 3.11 การเคลม (Claim)
- **External Entity:** Owner/Admin
- **Data Flow:**
  - Owner → [แจ้งเคลม] → Process 11: Claim
  - Process 11 → DS8: claims (สร้าง)
  - Process 11 → Admin (แจ้งเตือน)
  - Admin → [ตรวจสอบ/ตัดสิน] → Process 11
  - Process 11 → DS8: claims (อัปเดตสถานะ/ผล)
- **รายละเอียด:**
  - แจ้งเคลมสินค้าเสียหาย, แอดมินตัดสิน/ชดเชย

### 3.12 Wishlist (เพิ่ม/ลบสินค้าที่ถูกใจ)
- **External Entity:** User
- **Data Flow:**
  - User → [เพิ่ม/ลบ] → Process 12: Wishlist
  - Process 12 → DS14: wishlist (เขียน/ลบ)
- **รายละเอียด:**
  - เพิ่ม/ลบสินค้าในรายการโปรด

### 3.13 การจัดการโดยแอดมิน (Admin Management)
- **External Entity:** Admin
- **Data Flow:**
  - Admin → [จัดการผู้ใช้] → Process 13.1: User Management
    - Process 13.1 → DS1: users, DS9: admin_users (อ่าน/อัปเดต/ลบ)
  - Admin → [จัดการสินค้า] → Process 13.2: Product Management
    - Process 13.2 → DS2: products, DS10: categories (อ่าน/อัปเดต/ลบ)
  - Admin → [จัดการร้องเรียน/เคลม] → Process 13.3: Complaints/Claims Management
    - Process 13.3 → DS7: complaints, DS8: claims (อ่าน/อัปเดต/ปิดเรื่อง)
  - Admin → [ดูรายงาน/สถิติ] → Process 13.4: Reports/Analytics
    - Process 13.4 → DS1, DS2, DS3, DS4, DS7, DS8 (อ่าน)
  - Admin → [ตั้งค่าระบบ] → Process 13.5: System Settings
    - Process 13.5 → DS11: system_settings (อ่าน/อัปเดต)
- **รายละเอียด:**
  - แอดมินจัดการผู้ใช้, สินค้า, ร้องเรียน, เคลม, รายงาน, ตั้งค่าระบบ

---

## 4. Data Flow Summary (กระแสข้อมูลหลัก)
- ข้อมูลสมัคร/ล็อกอิน: Guest ↔ Process 1 ↔ DS1
- ข้อมูลยืนยันตัวตน: User ↔ Process 2 ↔ DS1 ↔ Admin
- ข้อมูลสินค้า: User ↔ Process 3/4 ↔ DS2 ↔ DS10 ↔ Admin
- ข้อมูลการเช่า: Renter ↔ Process 5 ↔ DS3 ↔ Owner ↔ Admin
- ข้อมูลชำระเงิน: Renter ↔ Process 6 ↔ DS4 ↔ DS3 ↔ Owner/Admin ↔ ระบบภายนอก
- ข้อมูลรับ-คืน: Renter/Owner ↔ Process 7 ↔ DS3 ↔ DS2
- ข้อมูลแชท: User ↔ Process 8 ↔ DS5 ↔ User
- ข้อมูลรีวิว: Renter/Owner ↔ Process 9 ↔ DS6 ↔ DS3
- ข้อมูลร้องเรียน: User ↔ Process 10 ↔ DS7 ↔ Admin
- ข้อมูลเคลม: Owner/Admin ↔ Process 11 ↔ DS8 ↔ Admin
- ข้อมูล wishlist: User ↔ Process 12 ↔ DS14
- ข้อมูลจัดการ: Admin ↔ Process 13.x ↔ DS1, DS2, DS3, DS4, DS7, DS8, DS9, DS10, DS11

---

> **หมายเหตุ:**
> - ทุก Process มีการตรวจสอบสิทธิ์/Session ก่อนเข้าถึงข้อมูล
> - กระแสข้อมูลระหว่าง Process กับ Data Store อาจมีการ validate, log, หรือแจ้งเตือนเสมอ
> - DFD นี้ครอบคลุม flow หลักและ flow ย่อยที่สำคัญทั้งหมดในระบบ Marketplace ให้เช่า-ให้เช่าสินค้าออนไลน์ RentEase Web 