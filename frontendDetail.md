# รายละเอียดโครงสร้างหน้า Frontend (Rentease Web V4)

## สารบัญ
- [หน้าหลักและสินค้า](#หน้าหลักและสินค้า)
- [ระบบผู้เช่า (Renter)](#ระบบผู้เช่า-renter)
- [ระบบเจ้าของสินค้า (Owner)](#ระบบเจ้าของสินค้า-owner)
- [ระบบผู้ดูแล (Admin)](#ระบบผู้ดูแล-admin)
- [ระบบผู้ใช้ทั่วไป (User)](#ระบบผู้ใช้ทั่วไป-user)
- [ระบบแชท (Chat)](#ระบบแชท-chat)
- [ระบบร้องเรียน (Complaints)](#ระบบร้องเรียน-complaints)
- [ระบบ Static/เนื้อหาคงที่](#ระบบ-staticเนื้อหาคงที่)
- [ระบบยืนยันตัวตน](#ระบบยืนยันตัวตน)
- [ระบบ Wishlist](#ระบบ-wishlist)
- [ระบบ Auth/เข้าสู่ระบบ-สมัครสมาชิก](#ระบบ-authเข้าสู่ระบบ-สมัครสมาชิก)

---

## หน้าหลักและสินค้า
### HomePage (`features/products/HomePage.tsx`)
- Hero Section: แบนเนอร์, คำอธิบาย, ช่องค้นหา
- Section "สินค้ายอดนิยม": แสดง ProductCard, ป้ายอันดับ, จำนวนการเช่า, ปุ่มดูทั้งหมด
- Section "ทำไมต้องเช่า...": จุดเด่น 4 ข้อ (ราคาดี, ปลอดภัย, หลากหลาย, Support)
- Section "ขั้นตอนการเช่า": 4 ขั้นตอน (ค้นหา, จอง, รับ, คืน)
- Call to Action: สมัครสมาชิก (ถ้ายังไม่ login)

### ProductDetailPage (`features/products/ProductDetailPage.tsx`)
- แกลเลอรี่รูปสินค้า, รายละเอียด, หมวดหมู่, ราคา, สถานะ, เจ้าของ, คะแนน, จำนวนรีวิว
- ปุ่ม "ขอเช่า" (ถ้าไม่ใช่เจ้าของ)
- Wishlist (เพิ่ม/ลบ)
- Tabs: รายละเอียด, สเปค, รีวิว
- Modal ขอเช่า: เลือกวัน, วิธีรับ, ที่อยู่, หมายเหตุ, สรุปยอด, ส่งคำขอ
- Section เจ้าของสินค้า: ข้อมูล, คะแนน, ปุ่มแชท

### SearchPage (`features/products/SearchPage.tsx`)
- ฟิลเตอร์: คำค้น, หมวดหมู่, จังหวัด, ราคา, เรียงลำดับ
- แสดง ProductCard แบบ grid
- Pagination
- สรุปจำนวนผลลัพธ์

### ProductFormPage (`features/owner/ProductFormPage.tsx`)
- ฟอร์มเพิ่ม/แก้ไขสินค้า: ชื่อ, รายละเอียด, หมวดหมู่, จังหวัด, ราคา, จำนวน, ระยะเวลา, ที่อยู่, สเปค (JSON), รูปภาพ (min 3, max 10), สถานะ
- Validation, Error, Success
- ปุ่มบันทึก/สร้าง

### ProductCard (`features/products/ProductCard.tsx`)
- Card สินค้า: รูป, ชื่อ, หมวดหมู่, จังหวัด, ราคา, ป้าย is_primary, ลิงก์ไปหน้ารายละเอียด
- ใช้ใน HomePage, SearchPage, Wishlist ฯลฯ

---

## ระบบผู้เช่า (Renter)
### RenterDashboardPage (`features/renter/RenterDashboardPage.tsx`)
- Sidebar: Dashboard, เช่าของฉัน, Wishlist
- สรุปสถานะการเช่า: Active, Confirmed, Pending, Completed, Cancelled, Late
- Quick Links: ไปยังหน้าสำคัญ (ค้นหา, ประวัติ, แชท, โปรไฟล์)

### MyRentalsPage (`features/renter/MyRentalsPage.tsx`)
- รายการเช่าของฉัน: Card รายการ, สถานะ, ฟิลเตอร์, ค้นหา, Pagination
- ปุ่มดูรายละเอียด, เขียนรีวิว (ถ้าเสร็จสิ้น)

### RenterRentalDetailPage (`features/renter/RenterRentalDetailPage.tsx`)
- รายละเอียดการเช่า: สถานะ, ข้อมูลสินค้า, ระยะเวลา, เจ้าของ, การชำระเงิน, การคืน, หมายเหตุ, ปุ่มยกเลิก, ปุ่มคืนสินค้า, ปุ่มรีวิว
- Modal แจ้งวันรับจริง, Modal คืนสินค้า (InitiateReturnForm)

### RentalCheckoutPage (`features/renter/RentalCheckoutPage.tsx`)
- ฟอร์มเลือกวันเช่า, วิธีรับ, หมายเหตุ, สรุปยอด, ปุ่มยืนยัน

### SubmitReviewPage (`features/renter/SubmitReviewPage.tsx`)
- ฟอร์มรีวิว: ให้คะแนนสินค้า, เจ้าของ, คอมเมนต์, ปุ่มส่ง

### InitiateReturnForm (`features/renter/InitiateReturnForm.tsx`)
- ฟอร์มคืนสินค้า: เลือกวิธีคืน, กรอกข้อมูล, แนบรูป, หมายเหตุ, ปุ่มส่ง

### PaymentPage (`features/renter/PaymentPage.tsx`)
- สรุปข้อมูลสินค้า, การเช่า, ยอดที่ต้องชำระ, วิธีโอนเงิน (บัญชี/PromptPay เจ้าของ)
- อัปโหลดสลิป/หลักฐานการโอน, Preview, ปุ่มส่ง, แสดงสถานะรออนุมัติ/สำเร็จ
- กรณีรอเจ้าของอนุมัติ: แสดงข้อความแจ้งเตือน
- กรณีจ่ายแล้ว: แสดงข้อความสำเร็จและปุ่มไปหน้ารายละเอียด

---

## ระบบเจ้าของสินค้า (Owner)
### OwnerDashboardPage (`features/owner/OwnerDashboardPage.tsx`)
- เมนูหลัก: สินค้าของฉัน, การเช่าทั้งหมด, รับคืน, วิธีรับเงิน, รายงาน, ตั้งค่าบัญชี
- สรุปข้อมูลสำคัญ, ลิงก์ไปยังหน้าต่าง ๆ

### MyListingsPage (`features/owner/MyListingsPage.tsx`)
- รายการสินค้าของฉัน: Card/Grid/List, ฟิลเตอร์, ค้นหา, สถานะ, ปุ่มแก้ไข/ลบ/เปลี่ยนสถานะ
- Pagination

### OwnerRentalHistoryPage (`features/owner/OwnerRentalHistoryPage.tsx`)
- ประวัติการเช่า: Card/List, ฟิลเตอร์, ค้นหา, สถานะ, วันที่, Pagination
- ปุ่มดูรายละเอียด

### OwnerRentalDetailPage (`features/owner/OwnerRentalDetailPage.tsx`)
- รายละเอียดการเช่า: ข้อมูลสินค้า, ผู้เช่า, ระยะเวลา, วิธีรับ, ที่อยู่, สถานะ, การชำระเงิน, การคืน, หมายเหตุ, ปุ่มอนุมัติ/ปฏิเสธ, ปุ่มยืนยันคืน, ปุ่มแชท, ปุ่มตรวจสอบ/ยืนยัน/ปฏิเสธสลิป, ฟอร์มอัปเดตสถานะจัดส่ง
- Modal ยืนยันคืน, Modal ปฏิเสธ, Modal slip ไม่ถูกต้อง

### PayoutInfoPage (`features/owner/PayoutInfoPage.tsx`)
- จัดการบัญชีรับเงิน: เพิ่ม/ลบ/ตั้งค่าหลัก, ฟอร์มเพิ่ม, รายการบัญชี, ปุ่มลบ/ตั้งค่าหลัก

### OwnerReportPage (`features/owner/OwnerReportPage.tsx`)
- รายงานเจ้าของ: กราฟ Pie/Bar, ตาราง, รายการจ่ายเงิน, สินค้ายอดนิยม, คะแนนรีวิว

---

## ระบบผู้ดูแล (Admin)
### AdminDashboardPage (`features/admin/AdminDashboardPage.tsx`)
- สรุปสถิติ: Users, Products, Rentals, Income, Complaints, กราฟ Bar
- ลิงก์ไปยังฟีเจอร์หลัก

### AdminLoginPage (`features/admin/AdminLoginPage.tsx`)
- ฟอร์มเข้าสู่ระบบผู้ดูแล: email/username, password, ปุ่มเข้าสู่ระบบ

### AdminManageUsersPage (`features/admin/AdminManageUsersPage.tsx`)
- ตารางผู้ใช้: ค้นหา, ฟิลเตอร์, สถานะ, ยืนยันตัวตน, ปุ่มแบน/ปลดแบน, ดูรายละเอียด
- Pagination

### AdminUserDetailPage (`features/admin/AdminUserDetailPage.tsx`)
- ข้อมูลผู้ใช้: โปรไฟล์, สถานะ, เอกสารยืนยันตัวตน, ปุ่มแบน/ปลดแบน, ปุ่มยืนยัน/ปฏิเสธเอกสาร

### AdminManageProductsPage (`features/admin/AdminManageProductsPage.tsx`)
- ตารางสินค้า: ค้นหา, ฟิลเตอร์, สถานะ, ปุ่มอนุมัติ/ปฏิเสธ, ดูรายละเอียด
- Pagination

### AdminProductDetailPage (`features/admin/AdminProductDetailPage.tsx`)
- ข้อมูลสินค้า: รายละเอียด, เจ้าของ, สถานะ, ปุ่มอนุมัติ/ปฏิเสธ, หมายเหตุ

### AdminManageCategoriesPage (`features/admin/AdminManageCategoriesPage.tsx`)
- จัดการหมวดหมู่: ตาราง, ฟอร์มเพิ่ม/แก้ไข, ปุ่มลบ, ค้นหา, ฟิลเตอร์

### AdminComplaintsPage (`features/admin/AdminComplaintsPage.tsx`)
- จัดการร้องเรียน: ตาราง, ดูรายละเอียด, ฟอร์มตอบกลับ, เปลี่ยนสถานะ, หมายเหตุ, แนบไฟล์, Pagination

### AdminReportsPage (`features/admin/AdminReportsPage.tsx`)
- รายงาน: กราฟ, ตาราง, ฟิลเตอร์, export CSV, ข้อมูลสถิติ, สินค้ายอดนิยม, คะแนนรีวิว

### AdminSystemSettingsPage (`features/admin/AdminSystemSettingsPage.tsx`)
- ตั้งค่าระบบ: ตาราง, ฟอร์มแก้ไข, ปุ่มบันทึก

### AdminManageStaticContentPage (`features/admin/AdminManageStaticContentPage.tsx`)
- จัดการเนื้อหาคงที่: ตาราง, ฟอร์มแก้ไข, ปุ่มบันทึก, ปุ่มยกเลิก

### AdminManageRentalsPage (`features/admin/AdminManageRentalsPage.tsx`)
- (ยังไม่ implement) แสดงข้อความ placeholder

### AdminRentalDetailPage (`features/admin/AdminRentalDetailPage.tsx`)
- ข้อมูลการเช่า: รายละเอียด, สถานะ, ปุ่มอัปเดต (coming soon)

---

## ระบบผู้ใช้ทั่วไป (User)
### UserProfilePage (`features/user/UserProfilePage.tsx`)
- ข้อมูลโปรไฟล์: รูป, ชื่อ, username, email, เบอร์, วันที่สมัคร, ปุ่มแก้ไข, ปุ่มยืนยันตัวตน
- ฟอร์มแก้ไขข้อมูล, ฟอร์มเปลี่ยนรหัสผ่าน
- จัดการที่อยู่: เพิ่ม/ลบ/แก้ไข, ฟอร์มเพิ่ม, รายการที่อยู่

### UserIdVerificationPage (`features/user/UserIdVerificationPage.tsx`)
- สถานะยืนยันตัวตน: badge, รายละเอียด, หมายเหตุ
- ฟอร์มส่งเอกสาร: เลือกประเภท, กรอกเลข, แนบไฟล์, ปุ่มส่ง

---

## ระบบแชท (Chat)
### ChatInboxPage (`features/chat/ChatInboxPage.tsx`)
- รายการแชท: Card, รูป, ชื่อ, ข้อความล่าสุด, สินค้าที่เกี่ยวข้อง, จำนวนยังไม่ได้อ่าน, ค้นหา, Pagination

### ChatRoomPage (`features/chat/ChatRoomPage.tsx`)
- ห้องแชท: รายละเอียดคู่สนทนา, รายการข้อความ, ส่งข้อความ, แนบไฟล์/รูป, Preview, ปุ่มกลับ, Scroll, Load more

---

## ระบบร้องเรียน (Complaints)
### UserComplaintsPage (`features/complaints/UserComplaintsPage.tsx` และ `features/user/UserComplaintsPage.tsx`)
- รายการร้องเรียนของฉัน: Card, สถานะ, หมวดหมู่, รายละเอียด, วันที่, ดูรายละเอียด
- ฟอร์มร้องเรียนใหม่: หัวข้อ, รายละเอียด, ประเภท, เลือกการเช่า, แนบไฟล์, ปุ่มส่ง
- Modal รายละเอียด: ข้อมูล, หมายเหตุ, แนบไฟล์, สถานะ, ปุ่มปิด
- (สำเนาใน 2 ที่: features/complaints/ และ features/user/)

---

## ระบบ Static/เนื้อหาคงที่
### StaticPage (`features/static/StaticPage.tsx`)
- แสดงเนื้อหาคงที่: about-us, terms-of-service, privacy-policy, หรือ slug อื่น ๆ
- ใช้ Card, แสดงหัวข้อ, เนื้อหา (HTML), วันที่อัปเดต

### FaqPage (`features/static/FaqPage.tsx`)
- Accordion: หมวดหมู่, คำถาม-คำตอบ, Card, Section

---

## ระบบ Wishlist
### WishlistPage (`features/user/WishlistPage.tsx`)
- รายการ Wishlist: Card, รูป, ชื่อ, หมวดหมู่, จังหวัด, ราคา, ปุ่มลบ, ปุ่มไปหน้ารายละเอียดสินค้า
- ถ้าไม่มีรายการ: แสดงข้อความ, ปุ่มไปค้นหาสินค้า

---

## ระบบ Auth/เข้าสู่ระบบ-สมัครสมาชิก
### LoginPage (`features/auth/LoginPage.tsx`)
- ฟอร์มเข้าสู่ระบบ: email/username, password, ปุ่มเข้าสู่ระบบ, ลืมรหัสผ่าน, ลิงก์สมัครสมาชิก

### RegisterPage (`features/auth/RegisterPage.tsx`)
- ฟอร์มสมัครสมาชิก: ชื่อ, username, email, password, ยืนยัน password, เบอร์, ปุ่มสมัคร, ลิงก์เข้าสู่ระบบ

### ForgotPasswordPage (`features/auth/ForgotPasswordPage.tsx`)
- ฟอร์มขอ reset password: กรอกอีเมล, ปุ่มส่ง OTP, แสดงข้อความสำเร็จ/ผิดพลาด
- ฟอร์มตั้งรหัสผ่านใหม่: กรอก OTP, รหัสใหม่, ยืนยันรหัส, ปุ่มบันทึก
- ลิงก์กลับเข้าสู่ระบบ

### ResetPasswordPage (`features/auth/ResetPasswordPage.tsx`)
- ฟอร์มตั้งรหัสผ่านใหม่: กรอกอีเมล, OTP, รหัสใหม่, ยืนยันรหัส, ปุ่มบันทึก
- แสดงข้อความสำเร็จ/ผิดพลาด, ลิงก์กลับเข้าสู่ระบบ

---

> **หมายเหตุ:**
> - รายละเอียดนี้อ้างอิงจากการอ่านโค้ดทุกไฟล์ใน features/* และ static/* ที่มีอยู่ในโปรเจกต์
> - หากมีไฟล์ใหม่หรือเปลี่ยนแปลงในอนาคต ควรอัปเดตเอกสารนี้ 