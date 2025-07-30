# รายละเอียดหน้า Frontend (RentEase)

---

## 1. กลุ่มหน้า Auth (Authentication)
- **LoginPage** (`/login`)
- **RegisterPage** (`/register`)
- **ForgotPasswordPage** (`/forgot-password`)
- **ResetPasswordPage** (`/reset-password/:token`)
  - ฟิลด์: อีเมล, รหัสผ่าน, ยืนยันรหัสผ่าน, OTP ฯลฯ
  - ปุ่ม: "เข้าสู่ระบบ", "สมัครสมาชิก", "ลืมรหัสผ่าน", "ส่ง OTP", "รีเซ็ตรหัสผ่าน"
  - Flow: สมัคร/เข้าสู่ระบบ/รีเซ็ต/OTP → ไปหน้าหลักหรือโปรไฟล์
  - API: `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`

---

## 2. กลุ่มหน้า User
- **UserProfilePage** (`/profile`)
  - ฟิลด์: ชื่อ, เบอร์, ที่อยู่, รหัสผ่านใหม่, รูปโปรไฟล์
  - ปุ่ม: "บันทึก", "เปลี่ยนรหัสผ่าน", "อัปโหลดรูป"
  - Flow: แก้ไข/บันทึก/เปลี่ยนรหัสผ่าน/อัปโหลดรูป
  - API: `GET/PUT /users/me/profile`, `PUT /users/me/password`, `POST /users/me/avatar`
- **UserIdVerificationPage** (`/profile/id-verification`)
  - ฟิลด์: ประเภทเอกสาร, หมายเลข, อัปโหลดไฟล์, หมายเหตุ
  - ปุ่ม: "ส่งเอกสาร"
  - Flow: ส่งเอกสาร → รอแอดมินตรวจสอบ
  - API: `GET/POST /users/me/id-verification`
- **WishlistPage** (`/my/wishlist`)
  - ปุ่ม: "ลบออกจากรายการโปรด", "ดูรายละเอียด"
  - Flow: คลิกสินค้า → ไปหน้ารายละเอียด, ลบออกจากรายการโปรด
  - API: `GET/POST/DELETE /wishlist`

---

## 3. กลุ่มหน้า Owner (เจ้าของสินค้า)
- **OwnerDashboardPage** (`/owner/dashboard`)
- **MyListingsPage** (`/owner/listings`)
- **ProductFormPage** (`/owner/listings/new`, `/owner/listings/edit/:productId`)
- **OwnerRentalHistoryPage** (`/owner/rentals`)
- **OwnerRentalDetailPage** (`/owner/rentals/:rentalId`)
- **PayoutInfoPage** (`/owner/payout-info`)
- **OwnerReportPage** (`/owner/report`)
  - ฟอร์ม: สร้าง/แก้ไขสินค้า, รายละเอียดการเช่า, รายงานปัญหา, ช่องทางรับเงิน
  - ปุ่ม: "เพิ่มสินค้าใหม่", "แก้ไข", "ลบ", "อนุมัติ/ปฏิเสธเช่า", "รายงานคืนสินค้า"
  - Flow: จัดการสินค้า/เช่า/รายงาน/รับเงิน
  - API: `GET/POST/PUT/DELETE /products`, `GET/POST /rentals`, `GET/POST /payout-methods`

---

## 4. กลุ่มหน้า Renter (ผู้เช่า)
- **RenterDashboardPage** (`/renter/dashboard`)
- **MyRentalsPage** (`/my-rentals`)
- **RentalCheckoutPage** (`/checkout/:productId`)
- **PaymentPage** (`/payment/:rentalId`)
- **RenterRentalDetailPage** (`/renter/rentals/:rentalId`)
- **SubmitReviewPage** (`/review/:rentalId`)
- **InitiateReturnForm** (modal/ฟอร์มย่อยใน RenterRentalDetailPage)
  - ฟอร์ม: แจ้งคืนสินค้า, อัปโหลดสลิป, รีวิว
  - ปุ่ม: "ชำระเงิน", "แจ้งคืนสินค้า", "ให้คะแนนรีวิว"
  - Flow: เช่า/ชำระ/คืน/รีวิว
  - API: `GET/POST /rentals`, `POST /rentals/:id/payment-proof`, `POST /rentals/:id/review`

---

## 5. กลุ่มหน้า Products
- **HomePage** (`/`)
- **SearchPage** (`/search`)
- **ProductDetailPage** (`/products/:id`)
- **ProductCard** (component ย่อย)
  - ฟิลด์: ช่องค้นหา, filter, วันที่เช่า, วิธีรับสินค้า ฯลฯ
  - ปุ่ม: "ค้นหา", "ขอเช่าสินค้า", "เพิ่มในรายการโปรด", "ติดต่อเจ้าของ"
  - Flow: ค้นหา/ดูรายละเอียด/ขอเช่า/แชท/รีวิว
  - API: `GET /products`, `GET /products/popular`, `GET /products/:id`, `POST /rentals`, `POST /chat/messages`, `GET/POST /wishlist`

---

## 6. กลุ่มหน้า Complaints (ร้องเรียน)
- **UserComplaintsPage** (`/my/complaints`)
  - ฟิลด์: รายละเอียดร้องเรียน, แนบไฟล์, ประเภท
  - ปุ่ม: "ส่งร้องเรียน"
  - Flow: กรอก/แนบไฟล์ → ส่ง → ติดตามสถานะ
  - API: `GET/POST /complaints`

---

## 7. กลุ่มหน้า Chat
- **ChatInboxPage** (`/chat`)
- **ChatRoomPage** (`/chat/:conversationId`)
  - ฟิลด์: ช่องค้นหา, กล่องข้อความ
  - ปุ่ม: "ส่งข้อความ"
  - Flow: เลือกห้องแชท → ส่งข้อความ → รับข้อความแบบ real-time
  - API: `GET /chat/conversations`, `GET/POST /chat/messages`

---

## 8. กลุ่มหน้า Admin
- **AdminLoginPage** (`/admin/login`)
- **AdminDashboardPage** (`/admin/dashboard`)
- **AdminManageUsersPage** (`/admin/users`)
- **AdminUserDetailPage** (`/admin/users/:userId`)
- **AdminManageProductsPage** (`/admin/products`)
- **AdminProductDetailPage** (`/admin/products/:productId`)
- **AdminManageRentalsPage** (`/admin/rentals`)
- **AdminRentalDetailPage** (`/admin/rentals/:rentalId`)
- **AdminManageCategoriesPage** (`/admin/categories`)
- **AdminReportsPage** (`/admin/reports`)
- **AdminComplaintsPage** (`/admin/complaints`)
- **AdminManageStaticContentPage** (`/admin/static-content`)
- **AdminSystemSettingsPage** (`/admin/settings`)
  - ฟอร์ม: จัดการผู้ใช้, สินค้า, หมวดหมู่, รายงาน, ข้อร้องเรียน, เนื้อหาคงที่, ตั้งค่าระบบ
  - ปุ่ม: "อนุมัติ/ปฏิเสธ", "ลบ", "แก้ไข", "ดูรายละเอียด"
  - Flow: จัดการ/อนุมัติ/รายงาน/ตั้งค่า
  - API: `GET/POST/PUT/DELETE /admin/*`

---

## 9. กลุ่มหน้า Static
- **StaticPage** (`/about`, `/terms`, `/privacy`)
- **FaqPage** (`/faq`)
  - เนื้อหา: ข้อมูลคงที่, FAQ

---

**หมายเหตุ:**
- ทุกปุ่ม/ฟอร์ม/field ใช้ชื่อภาษาไทยตามไฟล์แปล
- ทุก flow อธิบายการเปลี่ยนหน้า/ผลลัพธ์
- ทุก API อ้างอิง endpoint จริง
- หากต้องการรายละเอียดเชิงลึกของแต่ละหน้า/บทบาท/flow เพิ่มเติม แจ้งได้เลย 


# คู่มือการใช้งาน API ฉบับเต็ม (RentEase API)

> **Base URL:** `https://renteaseapi-test.onrender.com` (หรือ URL ที่เซิร์ฟเวอร์รัน)

---

## โครงสร้าง Response มาตรฐาน

- **สำเร็จ**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "ข้อความ",
  "success": true
}
```
- **ผิดพลาด**
```json
{
  "statusCode": 400,
  "data": null,
  "message": "ข้อความผิดพลาด",
  "success": false,
  "errors": [ ... ]
}
```

---

## การยืนยันตัวตน (Authentication)
- ใช้ JWT ผ่าน `Authorization: Bearer <token>` ใน header
- บาง endpoint ต้อง login ก่อนถึงจะใช้งานได้

---

## หมวดหมู่ Endpoint
- [Auth (เข้าสู่ระบบ/รีเซ็ตรหัสผ่าน)](#auth)
- [User (ผู้ใช้)](#user)
- [Product (สินค้า)](#product)
- [Rental (เช่า)](#rental)
- [Claim (เคลม/ข้อพิพาท)](#claim)
- [Complaint (ร้องเรียน)](#complaint)
- [Chat (แชท)](#chat)
- [Owner (เจ้าของสินค้า)](#owner)
- [Renter (ผู้เช่า)](#renter)
- [Notification (แจ้งเตือน)](#notification)
- [Admin (แอดมิน)](#admin)
- [Province/Category (จังหวัด/หมวดหมู่)](#provincecategory)
- [Webhook (webhook)](#webhook)

---

## <a name="auth"></a> Auth (เข้าสู่ระบบ/รีเซ็ตรหัสผ่าน)

### POST `/auth/login`
- **Request:**
```json
{
  "email_or_username": "string",
  "password": "string"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": {
    "access_token": "...",
    "user": { ... },
    "is_admin": false
  },
  "message": "Login successful.",
  "success": true
}
```

### POST `/auth/request-password-reset`
- **Request:**
```json
{
  "email": "string"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### POST `/auth/reset-password-with-otp`
- **Request:**
```json
{
  "email": "string",
  "otp": "string",
  "new_password": "string"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

---

## <a name="user"></a> User (ผู้ใช้)

### POST `/users/register`
- **Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password_confirmation": "string",
  "first_name": "string",
  "last_name": "string",
  "phone_number": "string (optional)"
}
```
- **Response:**
```json
{
  "statusCode": 201,
  "data": {
    "user": { ... },
    "access_token": "..."
  },
  "message": "Registration successful. You are now logged in.",
  "success": true
}
```

### GET `/users/me` *(ต้อง Auth)*
- **Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": { ... }
  },
  "success": true
}
```

### PUT `/users/me/profile` *(ต้อง Auth)*
- **Request:** (ส่งเฉพาะ field ที่ต้องการแก้ไข)
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "phone_number": "string (optional)",
  "address_line1": "string (optional)",
  "address_line2": "string (optional)",
  "city": "string (optional)",
  "province_id": 1,
  "postal_code": "string (optional)"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": { ... }
  },
  "message": "Profile updated successfully.",
  "success": true
}
```

### POST `/users/me/avatar` *(ต้อง Auth, multipart/form-data)*
- **Request:**
  - `avatar` (file, image)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Avatar updated successfully.",
  "success": true
}
```

### PUT `/users/me/password` *(ต้อง Auth)*
- **Request:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### ID Verification
- **GET `/users/me/id-verification`** *(ต้อง Auth)*
- **POST `/users/me/id-verification`** *(ต้อง Auth, multipart/form-data)*
  - `id_document` (file, image, required)
  - `id_document_back` (file, image, optional)
  - `id_selfie` (file, image, required)
  - `id_document_type`, `id_document_number` (text)

---

## <a name="product"></a> Product (สินค้า)

### GET `/products`
- **Query:**
  - `q` (string, optional) — คำค้นหา
  - `category_id` (number, optional)
  - `province_ids` (string, comma-separated, optional)
  - `min_price`, `max_price` (number, optional)
  - `sort` (string, optional: created_at_desc, price_asc, ...)
  - `page`, `limit` (number, optional)
- **Response:**
```json
{
  "statusCode": 200,
  "data": [ { ...product... } ],
  "success": true
}
```

### GET `/products/:product_slug_or_id`
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ...product... } },
  "success": true
}
```

### POST `/products` *(ต้อง Auth, multipart/form-data)*
- **Request:**
  - `images[]` (file, image, หลายไฟล์)
  - ข้อมูลสินค้า (ดู schema createProductSchema)
- **Response:**
```json
{
  "statusCode": 201,
  "data": { ... },
  "message": "Product created successfully",
  "success": true
}
```

### PUT `/products/:product_slug_or_id` *(ต้อง Auth, multipart/form-data)*
- **Request:**
  - `new_images[]` (file, image, หลายไฟล์)
  - ข้อมูลสินค้า (ดู schema updateProductSchema)
  - `remove_image_ids` (string/array, optional)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### DELETE `/products/:productId` *(ต้อง Auth)*
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### หมายเหตุ
- การอัปโหลดไฟล์ต้องใช้ `multipart/form-data` และ field name ตามที่ระบุ
- ต้องส่ง JWT ใน header ทุก endpoint ที่ต้อง Auth

---

## <a name="rental"></a> Rental (เช่า)

### POST `/rentals` *(ต้อง Auth)*
- **Request:**
```json
{
  "product_id": 1,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "pickup_method": "self_pickup|delivery",
  "delivery_address_id": 1, // ถ้าเลือก delivery
  "notes_from_renter": "string (optional)"
}
```
- **Response:**
```json
{
  "statusCode": 201,
  "data": { "data": { ...rental... } },
  "message": "Rental request submitted successfully.",
  "success": true
}
```

### GET `/rentals/:rental_id_or_uid` *(ต้อง Auth)*
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ...rental... } },
  "success": true
}
```

### PUT `/rentals/:rental_id_or_uid/approve` *(ต้อง Auth, owner)*
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Rental approved successfully.",
  "success": true
}
```

### PUT `/rentals/:rental_id_or_uid/reject` *(ต้อง Auth, owner)*
- **Request:**
```json
{ "reason": "string" }
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Rental rejected successfully.",
  "success": true
}
```

### PUT `/rentals/:rental_id_or_uid/payment-proof` *(ต้อง Auth, renter, multipart/form-data)*
- **Request:**
  - `payment_proof_image` (file, image)
  - `transaction_time`, `amount_paid` (text)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### POST `/rentals/:rental_id_or_uid/initiate-payment` *(ต้อง Auth, renter)*
- **Request:**
```json
{ "payment_method_type": "credit_card|promptpay_qr|bank_transfer" }
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "...",
  "success": true
}
```

### PUT `/rentals/:rental_id_or_uid/cancel` *(ต้อง Auth, renter)*
- **Request:**
```json
{ "reason": "string" }
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Rental cancelled successfully.",
  "success": true
}
```

### POST `/rentals/:rental_id_or_uid/initiate-return` *(ต้อง Auth, renter, multipart/form-data)*
- **Request:**
  - `shipping_receipt_image` (file, image, optional)
  - ข้อมูล return (ดู initiateReturnSchema)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Return process initiated successfully. Owner has been notified.",
  "success": true
}
```

### PUT `/rentals/:rental_id_or_uid/return` *(ต้อง Auth, owner, multipart/form-data)*
- **Request:**
  - `return_condition_images[]` (file, image, หลายไฟล์)
  - ข้อมูล return (ดู returnProcessSchema)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "...",
  "success": true
}
```

---

## <a name="claim"></a> Claim (เคลม/ข้อพิพาท)

### POST `/claims` *(ต้อง Auth, owner, multipart/form-data)*
- **Request:**
  - `attachments[]` (file, image, หลายไฟล์)
  - ข้อมูล claim (ดู createClaimSchema)
- **Response:**
```json
{
  "statusCode": 201,
  "data": { "data": { ... } },
  "message": "Claim created successfully.",
  "success": true
}
```

### POST `/claims/:claim_id_or_uid/respond` *(ต้อง Auth, renter, multipart/form-data)*
- **Request:**
  - `attachments[]` (file, image, หลายไฟล์)
  - ข้อมูล response (ดู respondToClaimSchema)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Response submitted successfully.",
  "success": true
}
```

---

## <a name="complaint"></a> Complaint (ร้องเรียน)

### POST `/complaints` *(ต้อง Auth, multipart/form-data)*
- **Request:**
  - `attachments` (file, image, หลายไฟล์)
  - ข้อมูล complaint (ดู createComplaintSchema)
- **Response:**
```json
{
  "statusCode": 201,
  "data": { "data": { ... } },
  "message": "Complaint created successfully",
  "success": true
}
```

### POST `/complaints/:complaintId/updates` *(ต้อง Auth, multipart/form-data)*
- **Request:**
  - `attachments` (file, image, หลายไฟล์)
  - ข้อมูล update (ดู updateComplaintSchema)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { "data": { ... } },
  "message": "Complaint updated successfully",
  "success": true
}
```

---

## <a name="chat"></a> Chat (แชท)

### GET `/chat/conversations` *(ต้อง Auth)*
- **Query:**
  - `page`, `limit` (number, optional)
- **Response:**
```json
{
  "statusCode": 200,
  "data": [ ... ],
  "success": true
}
```

### POST `/chat/messages` *(ต้อง Auth)*
- **Request:**
```json
{
  "receiver_id": 1, // หรือ conversation_id
  "message_content": "string",
  "message_type": "text|image|file",
  "related_product_id": 1,
  "related_rental_id": 1
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "success": true
}
```

---

## <a name="owner"></a> Owner (เจ้าของสินค้า)

### GET `/owners/me/dashboard` *(ต้อง Auth)*
### GET `/owners/me/products` *(ต้อง Auth)*
### GET `/owners/me/rentals` *(ต้อง Auth)*
### GET `/owners/me/payout-methods` *(ต้อง Auth)*
### POST `/owners/me/payout-methods` *(ต้อง Auth)*
### PUT `/owners/me/payout-methods/:methodId` *(ต้อง Auth)*
### DELETE `/owners/me/payout-methods/:methodId` *(ต้อง Auth)*
### PUT `/owners/me/payout-methods/:methodId/primary` *(ต้อง Auth)*

---

## <a name="renter"></a> Renter (ผู้เช่า)

### GET `/renters/me/dashboard` *(ต้อง Auth)*
### GET `/renters/me/rentals` *(ต้อง Auth)*

---

## <a name="notification"></a> Notification (แจ้งเตือน)

### GET `/notifications` *(ต้อง Auth)*
### POST `/notifications/mark-read` *(ต้อง Auth)*

---

## <a name="admin"></a> Admin (แอดมิน)

- **Login:** `POST /admin/login`
- **User Management:** `GET/PUT/POST/DELETE /admin/users...`
- **Complaints Management:** `GET/PUT /admin/complaints...`
- **Reports:** `GET /admin/reports/...`
- **Product/Category Management:** `GET/POST/PUT/DELETE /admin/products|categories...`
- **Settings:** `GET/PUT /admin/settings`
- **Static Pages:** `GET/PUT /admin/static-pages...`

---

## <a name="provincecategory"></a> Province/Category (จังหวัด/หมวดหมู่)

### GET `/provinces`
### GET `/categories`

---

## <a name="webhook"></a> Webhook

### POST `/webhooks/payment-gateway`
- **Request:**
  - ข้อมูลตามที่ payment gateway ส่งมา (JSON)
- **Response:**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Webhook received.",
  "success": true
}
```

---

## ตัวอย่างโครงสร้างข้อมูล (Response/Field) ของแต่ละ Resource

### Product (สินค้า)
```json
{
  "id": 1,
  "title": "กล้องถ่ายรูป Canon EOS R6",
  "category_id": 2,
  "province_id": 10,
  "description": "กล้องสภาพดี พร้อมเลนส์ 24-105mm",
  "specifications": { "sensor": "Full Frame", "megapixel": 20 },
  "rental_price_per_day": 500.00,
  "rental_price_per_week": 3000.00,
  "rental_price_per_month": 10000.00,
  "security_deposit": 2000.00,
  "quantity": 2,
  "min_rental_duration_days": 1,
  "max_rental_duration_days": 30,
  "address_details": "123/45 ถ.สุขุมวิท",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "condition_notes": "ใช้งานได้ปกติ มีรอยขีดข่วนเล็กน้อย",
  "images": [
    { "id": 101, "url": "https://.../img1.jpg" },
    { "id": 102, "url": "https://.../img2.jpg" }
  ],
  "owner": {
    "id": 5,
    "first_name": "สมชาย",
    "last_name": "ใจดี"
  },
  "created_at": "2024-06-01T10:00:00Z",
  "updated_at": "2024-06-02T12:00:00Z"
}
```

### Rental (เช่า)
```json
{
  "id": 10,
  "product_id": 1,
  "renter_id": 7,
  "start_date": "2024-06-10",
  "end_date": "2024-06-15",
  "pickup_method": "delivery",
  "delivery_address": {
    "id": 3,
    "recipient_name": "สมหญิง",
    "phone_number": "0812345678",
    "address_line1": "99/1 ถ.เพชรบุรี",
    "district": "บางกะปิ",
    "province": { "id": 10, "name_th": "กรุงเทพมหานคร" },
    "postal_code": "10310"
  },
  "status": "confirmed",
  "notes_from_renter": "ขอรับของช่วงเช้า",
  "total_price": 2500.00,
  "security_deposit": 2000.00,
  "created_at": "2024-06-01T11:00:00Z"
}
```

### Claim (เคลม/ข้อพิพาท)
```json
{
  "id": 2,
  "rental_id": 10,
  "claim_type": "damage",
  "claim_details": "เลนส์มีรอยร้าว",
  "requested_amount": 1500.00,
  "attachments": [
    { "id": 201, "url": "https://.../damage1.jpg" }
  ],
  "status": "pending",
  "created_at": "2024-06-16T09:00:00Z"
}
```

### Complaint (ร้องเรียน)
```json
{
  "id": 3,
  "title": "ผู้เช่าคืนของล่าช้า",
  "details": "ผู้เช่าคืนของช้ากว่ากำหนด 2 วัน",
  "complaint_type": "late_return",
  "related_rental_id": 10,
  "attachments": [
    { "id": 301, "url": "https://.../late1.jpg" }
  ],
  "status": "open",
  "created_at": "2024-06-17T08:00:00Z"
}
```

### Chat (แชท)
```json
{
  "id": 5,
  "participants": [
    { "id": 7, "first_name": "สมหญิง" },
    { "id": 5, "first_name": "สมชาย" }
  ],
  "messages": [
    {
      "id": 1001,
      "sender_id": 7,
      "message_content": "สนใจเช่ากล้องครับ",
      "message_type": "text",
      "created_at": "2024-06-01T12:00:00Z"
    },
    {
      "id": 1002,
      "sender_id": 5,
      "message_content": "ได้ครับ ว่างช่วงไหนบ้าง",
      "message_type": "text",
      "created_at": "2024-06-01T12:01:00Z"
    }
  ]
}
```

### User (ผู้ใช้)
```json
{
  "id": 7,
  "username": "somsri123",
  "email": "somsri@example.com",
  "first_name": "สมศรี",
  "last_name": "ใจดี",
  "phone_number": "0812345678",
  "is_active": true,
  "created_at": "2024-05-20T09:00:00Z"
}
```

### Owner (เจ้าของสินค้า)
```json
{
  "id": 5,
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "dashboard": {
    "total_products": 8,
    "total_rentals": 15,
    "income_this_month": 12000.00
  }
}
```

### Renter (ผู้เช่า)
```json
{
  "id": 7,
  "first_name": "สมหญิง",
  "last_name": "ใจดี",
  "dashboard": {
    "total_rentals": 5,
    "active_rentals": 1
  }
}
```

### Notification (แจ้งเตือน)
```json
{
  "id": 11,
  "user_id": 7,
  "type": "rental_approved",
  "message": "คำขอเช่าของคุณได้รับการอนุมัติแล้ว",
  "is_read": false,
  "created_at": "2024-06-02T13:00:00Z"
}
```

### Admin (แอดมิน)
```json
{
  "id": 1,
  "email": "admin@rentease.com",
  "role": "admin",
  "is_active": true
}
```

### Province (จังหวัด)
```json
{
  "id": 10,
  "name_th": "กรุงเทพมหานคร",
  "name_en": "Bangkok"
}
```

### Category (หมวดหมู่)
```json
{
  "id": 2,
  "name": "กล้องถ่ายรูป",
  "featured": true
}
```

### Webhook (payment-gateway)
```json
{
  "event": "payment_success",
  "transaction_id": "abc123",
  "amount": 2500.00,
  "status": "success",
  "timestamp": "2024-06-18T10:00:00Z"
}
```

---

## ตัวอย่าง Response จริงของทุก Endpoint หลัก

### Auth

#### POST `/auth/login`
```json
{
  "statusCode": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 7,
      "username": "somsri123",
      "email": "somsri@example.com",
      "first_name": "สมศรี",
      "last_name": "ใจดี",
      "is_active": true
    },
    "is_admin": false
  },
  "message": "Login successful.",
  "success": true
}
```

#### POST `/auth/request-password-reset`
```json
{
  "statusCode": 200,
  "data": {
    "message": "OTP sent to your email."
  },
  "message": "OTP sent to your email.",
  "success": true
}
```

#### POST `/auth/reset-password-with-otp`
```json
{
  "statusCode": 200,
  "data": {
    "message": "Password reset successful."
  },
  "message": "Password reset successful.",
  "success": true
}
```

---

### User

#### POST `/users/register`
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": 8,
      "username": "newuser",
      "email": "newuser@example.com",
      "first_name": "ใหม่",
      "last_name": "ใจดี",
      "is_active": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  },
  "message": "Registration successful. You are now logged in.",
  "success": true
}
```

#### GET `/users/me`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": 7,
      "username": "somsri123",
      "email": "somsri@example.com",
      "first_name": "สมศรี",
      "last_name": "ใจดี",
      "phone_number": "0812345678",
      "is_active": true,
      "created_at": "2024-05-20T09:00:00Z"
    }
  },
  "success": true
}
```

#### PUT `/users/me/profile`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": 7,
      "first_name": "สมศรี",
      "last_name": "ใจดี",
      "phone_number": "0812345678"
    }
  },
  "message": "Profile updated successfully.",
  "success": true
}
```

#### POST `/users/me/avatar`
```json
{
  "statusCode": 200,
  "data": {
    "avatar_url": "https://.../avatar7.jpg"
  },
  "message": "Avatar updated successfully.",
  "success": true
}
```

#### PUT `/users/me/password`
```json
{
  "statusCode": 200,
  "data": {
    "message": "Password changed successfully."
  },
  "message": "Password changed successfully.",
  "success": true
}
```

#### GET `/users/me/id-verification`
```json
{
  "success": true,
  "message": "ID verification status fetched successfully.",
  "data": {
    "status": "pending",
    "submitted_at": "2024-06-01T10:00:00Z"
  }
}
```

#### POST `/users/me/id-verification`
```json
{
  "success": true,
  "message": "ID verification documents submitted successfully",
  "data": {
    "id": 1,
    "user_id": 7,
    "status": "pending"
  }
}
```

#### GET `/users/me/wishlist`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "กล้องถ่ายรูป Canon EOS R6",
      "category_id": 2
    }
  ],
  "success": true
}
```

---

### Product

#### GET `/products`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "กล้องถ่ายรูป Canon EOS R6",
      "category_id": 2,
      "province_id": 10,
      "rental_price_per_day": 500.00
    }
  ],
  "success": true
}
```

#### GET `/products/:product_slug_or_id`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 1,
      "title": "กล้องถ่ายรูป Canon EOS R6",
      "description": "กล้องสภาพดี พร้อมเลนส์ 24-105mm",
      "images": [
        { "id": 101, "url": "https://.../img1.jpg" }
      ]
    }
  },
  "success": true
}
```

#### POST `/products`
```json
{
  "statusCode": 201,
  "data": {
    "id": 2,
    "title": "เลนส์ Canon RF 50mm F1.8",
    "category_id": 2
  },
  "message": "Product created successfully",
  "success": true
}
```

#### PUT `/products/:product_slug_or_id`
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "title": "กล้องถ่ายรูป Canon EOS R6 (อัปเดต)"
  },
  "message": "Product updated successfully.",
  "success": true
}
```

#### DELETE `/products/:productId`
```json
{
  "statusCode": 200,
  "data": {
    "id": 1
  },
  "message": "Product deleted successfully.",
  "success": true
}
```

---

### Rental

#### POST `/rentals`
```json
{
  "statusCode": 201,
  "data": {
    "data": {
      "id": 10,
      "product_id": 1,
      "renter_id": 7,
      "status": "pending_owner_approval"
    }
  },
  "message": "Rental request submitted successfully.",
  "success": true
}
```

#### GET `/rentals/:rental_id_or_uid`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "product_id": 1,
      "status": "confirmed"
    }
  },
  "success": true
}
```

#### PUT `/rentals/:rental_id_or_uid/approve`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "status": "confirmed"
    }
  },
  "message": "Rental approved successfully.",
  "success": true
}
```

#### PUT `/rentals/:rental_id_or_uid/reject`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "status": "rejected_by_owner"
    }
  },
  "message": "Rental rejected successfully.",
  "success": true
}
```

#### PUT `/rentals/:rental_id_or_uid/payment-proof`
```json
{
  "statusCode": 200,
  "data": {
    "payment_proof_url": "https://.../proof10.jpg"
  },
  "message": "Payment proof uploaded successfully.",
  "success": true
}
```

#### POST `/rentals/:rental_id_or_uid/initiate-payment`
```json
{
  "statusCode": 200,
  "data": {
    "payment_url": "https://gateway.com/pay/abc123"
  },
  "message": "Payment initiated.",
  "success": true
}
```

#### PUT `/rentals/:rental_id_or_uid/cancel`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "status": "cancelled_by_renter"
    }
  },
  "message": "Rental cancelled successfully.",
  "success": true
}
```

#### POST `/rentals/:rental_id_or_uid/initiate-return`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "status": "return_pending"
    }
  },
  "message": "Return process initiated successfully. Owner has been notified.",
  "success": true
}
```

#### PUT `/rentals/:rental_id_or_uid/return`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 10,
      "status": "completed"
    }
  },
  "message": "Return processed successfully.",
  "success": true
}
```

---

### Claim

#### POST `/claims`
```json
{
  "statusCode": 201,
  "data": {
    "data": {
      "id": 2,
      "rental_id": 10,
      "claim_type": "damage",
      "status": "pending"
    }
  },
  "message": "Claim created successfully.",
  "success": true
}
```

#### POST `/claims/:claim_id_or_uid/respond`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 2,
      "status": "responded"
    }
  },
  "message": "Response submitted successfully.",
  "success": true
}
```

---

### Complaint

#### POST `/complaints`
```json
{
  "statusCode": 201,
  "data": {
    "data": {
      "id": 3,
      "title": "ผู้เช่าคืนของล่าช้า",
      "status": "open"
    }
  },
  "message": "Complaint created successfully",
  "success": true
}
```

#### POST `/complaints/:complaintId/updates`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "id": 3,
      "status": "updated"
    }
  },
  "message": "Complaint updated successfully",
  "success": true
}
```

---

### Chat

#### GET `/chat/conversations`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 5,
      "participants": [
        { "id": 7, "first_name": "สมหญิง" },
        { "id": 5, "first_name": "สมชาย" }
      ],
      "last_message": {
        "id": 1002,
        "message_content": "ได้ครับ ว่างช่วงไหนบ้าง"
      }
    }
  ],
  "success": true
}
```

#### POST `/chat/messages`
```json
{
  "statusCode": 200,
  "data": {
    "id": 1003,
    "sender_id": 7,
    "message_content": "ขอจองวันที่ 10-15 ครับ",
    "message_type": "text",
    "created_at": "2024-06-01T12:05:00Z"
  },
  "success": true
}
```

---

### Owner

#### GET `/owners/me/dashboard`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "total_products": 8,
      "total_rentals": 15,
      "income_this_month": 12000.00
    }
  },
  "success": true
}
```

#### GET `/owners/me/products`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "กล้องถ่ายรูป Canon EOS R6"
    }
  ],
  "success": true
}
```

#### GET `/owners/me/rentals`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 10,
      "product_id": 1,
      "status": "confirmed"
    }
  ],
  "success": true
}
```

---

### Renter

#### GET `/renters/me/dashboard`
```json
{
  "statusCode": 200,
  "data": {
    "data": {
      "total_rentals": 5,
      "active_rentals": 1
    }
  },
  "success": true
}
```

#### GET `/renters/me/rentals`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 10,
      "product_id": 1,
      "status": "active"
    }
  ],
  "success": true
}
```

---

### Notification

#### GET `/notifications`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 11,
      "type": "rental_approved",
      "message": "คำขอเช่าของคุณได้รับการอนุมัติแล้ว",
      "is_read": false
    }
  ],
  "success": true
}
```

#### POST `/notifications/mark-read`
```json
{
  "statusCode": 200,
  "data": {
    "updated": 1
  },
  "success": true
}
```

---

### Admin

#### POST `/admin/login`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@rentease.com",
    "role": "admin"
  }
}
```

#### GET `/admin/users`
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "username": "somsri123",
      "email": "somsri@example.com",
      "is_active": true
    }
  ]
}
```

---

### Province

#### GET `/provinces`
```json
{
  "statusCode": 200,
  "data": [
    { "id": 10, "name_th": "กรุงเทพมหานคร", "name_en": "Bangkok" }
  ],
  "success": true
}
```

---

### Category

#### GET `/categories`
```json
{
  "statusCode": 200,
  "data": [
    { "id": 2, "name": "กล้องถ่ายรูป", "featured": true }
  ],
  "success": true
}
```

---

### Webhook

#### POST `/webhooks/payment-gateway`
```json
{
  "statusCode": 200,
  "data": {
    "event": "payment_success",
    "transaction_id": "abc123",
    "amount": 2500.00,
    "status": "success",
    "timestamp": "2024-06-18T10:00:00Z"
  },
  "message": "Webhook received.",
  "success": true
}
```

---

> **หมายเหตุ:**
> - ตัวอย่างข้างต้นเป็นตัวอย่างข้อมูลจริงที่อ้างอิงจากโครงสร้าง schema validation และโค้ดจริง
> - ฟิลด์แต่ละอันอาจมีมากกว่านี้ ขึ้นกับ endpoint และสิทธิ์ของผู้ใช้
> - สามารถดูรายละเอียด schema validation เพิ่มเติมในไฟล์ DTOs ของแต่ละ resource

---

## หมายเหตุสำคัญ
- ทุก endpoint ที่ต้อง Auth ต้องส่ง JWT ใน header
- การอัปโหลดไฟล์ต้องใช้ `multipart/form-data` และ field name ตามที่ระบุ
- ตัวอย่าง request/response ทุกอันอ้างอิงจากโค้ดจริงและ schema validation
- สามารถดูรายละเอียด field/schema เพิ่มเติมในไฟล์ DTOs
- ทุก endpoint ที่มีการ validate request จะคืน error message ตาม Joi schema 