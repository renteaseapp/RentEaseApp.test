<<<<<<< HEAD
# API Integration Guide - Owner Rental History

## 📋 **ภาพรวม**
คู่มือนี้แสดงการใช้งาน API สำหรับหน้า Owner Rental History ที่อัปเดตแล้ว

---

## 🔧 **การอัปเดตที่ทำ**

### 1. **อัปเดต rentalService.ts**
- เพิ่มฟังก์ชัน `getOwnerRentals()` สำหรับดึงข้อมูลการเช่าของเจ้าของ
- เพิ่มฟังก์ชัน `getRentalByIdOrUid()` สำหรับดึงรายละเอียดการเช่า
- อัปเดตฟังก์ชัน `approveRentalRequest()` และ `rejectRentalRequest()` ให้ใช้ API ใหม่
- **เพิ่มฟังก์ชัน `notifyReturn()` สำหรับให้ผู้เช่าแจ้งคืนสินค้า**

### 2. **อัปเดต OwnerRentalHistoryPage.tsx**
- ใช้ API `GET /api/owners/me/rentals` แทน API เดิม
- เพิ่มฟีเจอร์การค้นหาและกรองข้อมูล
- เพิ่ม pagination
- ปรับปรุง UI ให้ดูดีขึ้น

### 3. **อัปเดต OwnerRentalDetailPage.tsx**
- ใช้ API `GET /api/rentals/{rental_id_or_uid}` สำหรับดึงรายละเอียด
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/approve` สำหรับอนุมัติ
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/reject` สำหรับปฏิเสธ
- ปรับปรุง UI ให้แสดงข้อมูลครบถ้วน

### 4. **อัปเดต RenterRentalDetailPage.tsx**
- **เพิ่มปุ่ม "แจ้งคืนสินค้า" สำหรับสถานะ ACTIVE และ LATE_RETURN**
- **แสดงข้อมูลการคืนสินค้าหลังจากเจ้าของประมวลผลแล้ว**
- **เพิ่ม Dialog ยืนยันการแจ้งคืนสินค้า**
- **แสดงสถานะ RETURN_PENDING และ LATE_RETURN**

### 5. **อัปเดต MyRentalsPage.tsx**
- **เพิ่มปุ่มแจ้งคืนสินค้าในรายการการเช่า**
- **แสดงสถานะการคืนสินค้าด้วยสีที่แตกต่างกัน**
- **เพิ่มข้อความอธิบายสำหรับสถานะ RETURN_PENDING และ LATE_RETURN**

### 6. **อัปเดต types.ts**
- เพิ่ม `actual_pickup_time?: string | null`
- เพิ่ม `owner_payout_amount?: number | null`

---

## 🚀 **ฟีเจอร์ใหม่**

### **OwnerRentalHistoryPage**
- ✅ **การค้นหา**: ค้นหาตามชื่อสินค้า
- ✅ **การกรองสถานะ**: กรองตามสถานะการเช่า 12 แบบ
- ✅ **การกรองวันที่**: กรองตามช่วงวันที่
- ✅ **Pagination**: แสดงข้อมูลทีละหน้า
- ✅ **Status Badges**: แสดงสถานะด้วยสีที่แตกต่างกัน
- ✅ **Responsive Design**: รองรับทุกขนาดหน้าจอ

### **OwnerRentalDetailPage**
- ✅ **รายละเอียดครบถ้วน**: แสดงข้อมูลการเช่าทั้งหมด
- ✅ **การอนุมัติ/ปฏิเสธ**: สำหรับการเช่าที่รอการอนุมัติ
- ✅ **Timeline**: แสดงประวัติการเปลี่ยนแปลง
- ✅ **Financial Details**: แสดงรายละเอียดทางการเงิน
- ✅ **Actions Panel**: แสดงปุ่มดำเนินการตามสถานะ

### **RenterRentalDetailPage (ใหม่)**
- ✅ **ปุ่มแจ้งคืนสินค้า**: สำหรับสถานะ ACTIVE และ LATE_RETURN
- ✅ **Dialog ยืนยัน**: ยืนยันการแจ้งคืนสินค้า
- ✅ **ข้อมูลการคืนสินค้า**: แสดงข้อมูลหลังจากเจ้าของประมวลผล
- ✅ **สถานะการคืน**: แสดงสถานะ RETURN_PENDING และ LATE_RETURN
- ✅ **รูปภาพหลักฐาน**: แสดงรูปภาพที่เจ้าของอัปโหลด

### **MyRentalsPage (อัปเดต)**
- ✅ **ปุ่มแจ้งคืนสินค้า**: ในรายการการเช่า
- ✅ **สถานะสีใหม่**: สีม่วงสำหรับ RETURN_PENDING, สีแดงสำหรับ LATE_RETURN
- ✅ **ข้อความอธิบาย**: อธิบายสถานะการคืนสินค้า

---

## 📊 **API Endpoints ที่ใช้**

### 1. **GET /api/owners/me/rentals**
```typescript
// Query Parameters
{
  status?: string;        // สถานะการเช่า
  q?: string;            // ค้นหาชื่อสินค้า
  date_from?: string;    // วันที่เริ่มต้น (ISO)
  date_to?: string;      // วันที่สิ้นสุด (ISO)
  page?: number;         // หน้าข้อมูล
  limit?: number;        // จำนวนรายการต่อหน้า
}
```

### 2. **GET /api/rentals/{rental_id_or_uid}**
```typescript
// Path Parameters
rental_id_or_uid: string | number
```

### 3. **PUT /api/rentals/{rental_id_or_uid}/approve**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body: ไม่ต้องมี (empty)
```

### 4. **PUT /api/rentals/{rental_id_or_uid}/reject**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body
{
  reason: string;  // เหตุผลในการปฏิเสธ (5-500 ตัวอักษร)
}
```

### 5. **PUT /api/rentals/{rental_id_or_uid}/notify-return** (ใหม่)
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body: ไม่ต้องมี (empty)

// Response
{
  success: boolean;
  data: {
    data: Rental;  // ข้อมูลการเช่าที่อัปเดตแล้ว
  }
}
```

---

## 🎨 **UI Components ใหม่**

### **StatusBadge Component**
```typescript
<StatusBadge status="pending_owner_approval" type="rental" />
```

### **Pagination Component**
```typescript
<Pagination 
  currentPage={1} 
  totalPages={5} 
  onPageChange={handlePageChange} 
/>
```

### **Notify Return Dialog** (ใหม่)
```typescript
<NotifyReturnDialog 
  isOpen={showNotifyReturnDialog}
  onConfirm={handleNotifyReturn}
  onCancel={() => setShowNotifyReturnDialog(false)}
  isLoading={isNotifyingReturn}
/>
```

---

## 🔐 **การยืนยันตัวตน**
ทุก API ต้องใช้ Bearer Token:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📱 **การใช้งาน**

### **การเข้าถึงหน้า**
1. เข้าสู่ระบบด้วยบัญชีเจ้าของ
2. ไปที่ Owner Dashboard
3. คลิก "Rental History" หรือ "ประวัติการให้เช่า"

### **การกรองข้อมูล**
1. ใช้ช่องค้นหาเพื่อค้นหาสินค้า
2. เลือกสถานะจาก dropdown
3. กำหนดช่วงวันที่
4. คลิก "Apply Filters"

### **การอนุมัติ/ปฏิเสธ**
1. คลิก "View Details" ในรายการที่ต้องการ
2. ในหน้ารายละเอียด จะมีปุ่ม "Approve Request" หรือ "Reject Request"
3. สำหรับการปฏิเสธ ต้องระบุเหตุผล

### **การแจ้งคืนสินค้า (ผู้เช่า)** (ใหม่)
1. เข้าสู่ระบบด้วยบัญชีผู้เช่า
2. ไปที่ "My Rentals" หรือ "การเช่าของฉัน"
3. คลิก "View Details" ในรายการที่กำลังเช่า (ACTIVE) หรือคืนช้า (LATE_RETURN)
4. คลิกปุ่ม "แจ้งคืนสินค้า" หรือ "Notify Return"
5. ยืนยันการแจ้งคืนสินค้า
6. สถานะจะเปลี่ยนเป็น "รอการคืนสินค้า" (RETURN_PENDING)

### **การดูข้อมูลการคืนสินค้า (ผู้เช่า)** (ใหม่)
1. หลังจากเจ้าของประมวลผลการคืนสินค้าแล้ว
2. ในหน้ารายละเอียดการเช่าจะแสดงข้อมูล:
   - วันที่คืนสินค้า
   - สภาพสินค้า
   - หมายเหตุจากเจ้าของ
   - รูปภาพหลักฐาน

---

## 🐛 **การแก้ไขปัญหา**

### **Error Handling**
- 401: Token ไม่ถูกต้องหรือหมดอายุ
- 403: ไม่มีสิทธิ์เข้าถึง
- 404: ไม่พบข้อมูล
- 400: ข้อมูลไม่ถูกต้อง

### **Loading States**
- แสดง LoadingSpinner ขณะโหลดข้อมูล
- แสดง ErrorMessage เมื่อเกิดข้อผิดพลาด
- ปุ่มแสดงสถานะ loading ขณะดำเนินการ

---

## 📈 **Performance**
- ใช้ `useCallback` เพื่อป้องกัน re-render ที่ไม่จำเป็น
- ใช้ `useState` สำหรับจัดการ state
- ใช้ `useEffect` สำหรับการ fetch ข้อมูล
- ใช้ debounce สำหรับการค้นหา (ถ้าต้องการ)

---

## 🔄 **การอัปเดตในอนาคต**
- เพิ่มการแจ้งเตือน real-time
- เพิ่มการ export ข้อมูล
- เพิ่มการกรองเพิ่มเติม
- เพิ่มการแสดงสถิติ
- **เพิ่มการแจ้งเตือนเจ้าของเมื่อผู้เช่าแจ้งคืนสินค้า**
=======
# API Integration Guide - Owner Rental History

## 📋 **ภาพรวม**
คู่มือนี้แสดงการใช้งาน API สำหรับหน้า Owner Rental History ที่อัปเดตแล้ว

---

## 🔧 **การอัปเดตที่ทำ**

### 1. **อัปเดต rentalService.ts**
- เพิ่มฟังก์ชัน `getOwnerRentals()` สำหรับดึงข้อมูลการเช่าของเจ้าของ
- เพิ่มฟังก์ชัน `getRentalByIdOrUid()` สำหรับดึงรายละเอียดการเช่า
- อัปเดตฟังก์ชัน `approveRentalRequest()` และ `rejectRentalRequest()` ให้ใช้ API ใหม่
- **เพิ่มฟังก์ชัน `notifyReturn()` สำหรับให้ผู้เช่าแจ้งคืนสินค้า**

### 2. **อัปเดต OwnerRentalHistoryPage.tsx**
- ใช้ API `GET /api/owners/me/rentals` แทน API เดิม
- เพิ่มฟีเจอร์การค้นหาและกรองข้อมูล
- เพิ่ม pagination
- ปรับปรุง UI ให้ดูดีขึ้น

### 3. **อัปเดต OwnerRentalDetailPage.tsx**
- ใช้ API `GET /api/rentals/{rental_id_or_uid}` สำหรับดึงรายละเอียด
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/approve` สำหรับอนุมัติ
- ใช้ API `PUT /api/rentals/{rental_id_or_uid}/reject` สำหรับปฏิเสธ
- ปรับปรุง UI ให้แสดงข้อมูลครบถ้วน

### 4. **อัปเดต RenterRentalDetailPage.tsx**
- **เพิ่มปุ่ม "แจ้งคืนสินค้า" สำหรับสถานะ ACTIVE และ LATE_RETURN**
- **แสดงข้อมูลการคืนสินค้าหลังจากเจ้าของประมวลผลแล้ว**
- **เพิ่ม Dialog ยืนยันการแจ้งคืนสินค้า**
- **แสดงสถานะ RETURN_PENDING และ LATE_RETURN**

### 5. **อัปเดต MyRentalsPage.tsx**
- **เพิ่มปุ่มแจ้งคืนสินค้าในรายการการเช่า**
- **แสดงสถานะการคืนสินค้าด้วยสีที่แตกต่างกัน**
- **เพิ่มข้อความอธิบายสำหรับสถานะ RETURN_PENDING และ LATE_RETURN**

### 6. **อัปเดต types.ts**
- เพิ่ม `actual_pickup_time?: string | null`
- เพิ่ม `owner_payout_amount?: number | null`

---

## 🚀 **ฟีเจอร์ใหม่**

### **OwnerRentalHistoryPage**
- ✅ **การค้นหา**: ค้นหาตามชื่อสินค้า
- ✅ **การกรองสถานะ**: กรองตามสถานะการเช่า 12 แบบ
- ✅ **การกรองวันที่**: กรองตามช่วงวันที่
- ✅ **Pagination**: แสดงข้อมูลทีละหน้า
- ✅ **Status Badges**: แสดงสถานะด้วยสีที่แตกต่างกัน
- ✅ **Responsive Design**: รองรับทุกขนาดหน้าจอ

### **OwnerRentalDetailPage**
- ✅ **รายละเอียดครบถ้วน**: แสดงข้อมูลการเช่าทั้งหมด
- ✅ **การอนุมัติ/ปฏิเสธ**: สำหรับการเช่าที่รอการอนุมัติ
- ✅ **Timeline**: แสดงประวัติการเปลี่ยนแปลง
- ✅ **Financial Details**: แสดงรายละเอียดทางการเงิน
- ✅ **Actions Panel**: แสดงปุ่มดำเนินการตามสถานะ

### **RenterRentalDetailPage (ใหม่)**
- ✅ **ปุ่มแจ้งคืนสินค้า**: สำหรับสถานะ ACTIVE และ LATE_RETURN
- ✅ **Dialog ยืนยัน**: ยืนยันการแจ้งคืนสินค้า
- ✅ **ข้อมูลการคืนสินค้า**: แสดงข้อมูลหลังจากเจ้าของประมวลผล
- ✅ **สถานะการคืน**: แสดงสถานะ RETURN_PENDING และ LATE_RETURN
- ✅ **รูปภาพหลักฐาน**: แสดงรูปภาพที่เจ้าของอัปโหลด

### **MyRentalsPage (อัปเดต)**
- ✅ **ปุ่มแจ้งคืนสินค้า**: ในรายการการเช่า
- ✅ **สถานะสีใหม่**: สีม่วงสำหรับ RETURN_PENDING, สีแดงสำหรับ LATE_RETURN
- ✅ **ข้อความอธิบาย**: อธิบายสถานะการคืนสินค้า

---

## 📊 **API Endpoints ที่ใช้**

### 1. **GET /api/owners/me/rentals**
```typescript
// Query Parameters
{
  status?: string;        // สถานะการเช่า
  q?: string;            // ค้นหาชื่อสินค้า
  date_from?: string;    // วันที่เริ่มต้น (ISO)
  date_to?: string;      // วันที่สิ้นสุด (ISO)
  page?: number;         // หน้าข้อมูล
  limit?: number;        // จำนวนรายการต่อหน้า
}
```

### 2. **GET /api/rentals/{rental_id_or_uid}**
```typescript
// Path Parameters
rental_id_or_uid: string | number
```

### 3. **PUT /api/rentals/{rental_id_or_uid}/approve**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body: ไม่ต้องมี (empty)
```

### 4. **PUT /api/rentals/{rental_id_or_uid}/reject**
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body
{
  reason: string;  // เหตุผลในการปฏิเสธ (5-500 ตัวอักษร)
}
```

### 5. **PUT /api/rentals/{rental_id_or_uid}/notify-return** (ใหม่)
```typescript
// Path Parameters
rental_id_or_uid: string | number

// Body: ไม่ต้องมี (empty)

// Response
{
  success: boolean;
  data: {
    data: Rental;  // ข้อมูลการเช่าที่อัปเดตแล้ว
  }
}
```

---

## 🎨 **UI Components ใหม่**

### **StatusBadge Component**
```typescript
<StatusBadge status="pending_owner_approval" type="rental" />
```

### **Pagination Component**
```typescript
<Pagination 
  currentPage={1} 
  totalPages={5} 
  onPageChange={handlePageChange} 
/>
```

### **Notify Return Dialog** (ใหม่)
```typescript
<NotifyReturnDialog 
  isOpen={showNotifyReturnDialog}
  onConfirm={handleNotifyReturn}
  onCancel={() => setShowNotifyReturnDialog(false)}
  isLoading={isNotifyingReturn}
/>
```

---

## 🔐 **การยืนยันตัวตน**
ทุก API ต้องใช้ Bearer Token:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📱 **การใช้งาน**

### **การเข้าถึงหน้า**
1. เข้าสู่ระบบด้วยบัญชีเจ้าของ
2. ไปที่ Owner Dashboard
3. คลิก "Rental History" หรือ "ประวัติการให้เช่า"

### **การกรองข้อมูล**
1. ใช้ช่องค้นหาเพื่อค้นหาสินค้า
2. เลือกสถานะจาก dropdown
3. กำหนดช่วงวันที่
4. คลิก "Apply Filters"

### **การอนุมัติ/ปฏิเสธ**
1. คลิก "View Details" ในรายการที่ต้องการ
2. ในหน้ารายละเอียด จะมีปุ่ม "Approve Request" หรือ "Reject Request"
3. สำหรับการปฏิเสธ ต้องระบุเหตุผล

### **การแจ้งคืนสินค้า (ผู้เช่า)** (ใหม่)
1. เข้าสู่ระบบด้วยบัญชีผู้เช่า
2. ไปที่ "My Rentals" หรือ "การเช่าของฉัน"
3. คลิก "View Details" ในรายการที่กำลังเช่า (ACTIVE) หรือคืนช้า (LATE_RETURN)
4. คลิกปุ่ม "แจ้งคืนสินค้า" หรือ "Notify Return"
5. ยืนยันการแจ้งคืนสินค้า
6. สถานะจะเปลี่ยนเป็น "รอการคืนสินค้า" (RETURN_PENDING)

### **การดูข้อมูลการคืนสินค้า (ผู้เช่า)** (ใหม่)
1. หลังจากเจ้าของประมวลผลการคืนสินค้าแล้ว
2. ในหน้ารายละเอียดการเช่าจะแสดงข้อมูล:
   - วันที่คืนสินค้า
   - สภาพสินค้า
   - หมายเหตุจากเจ้าของ
   - รูปภาพหลักฐาน

---

## 🐛 **การแก้ไขปัญหา**

### **Error Handling**
- 401: Token ไม่ถูกต้องหรือหมดอายุ
- 403: ไม่มีสิทธิ์เข้าถึง
- 404: ไม่พบข้อมูล
- 400: ข้อมูลไม่ถูกต้อง

### **Loading States**
- แสดง LoadingSpinner ขณะโหลดข้อมูล
- แสดง ErrorMessage เมื่อเกิดข้อผิดพลาด
- ปุ่มแสดงสถานะ loading ขณะดำเนินการ

---

## 📈 **Performance**
- ใช้ `useCallback` เพื่อป้องกัน re-render ที่ไม่จำเป็น
- ใช้ `useState` สำหรับจัดการ state
- ใช้ `useEffect` สำหรับการ fetch ข้อมูล
- ใช้ debounce สำหรับการค้นหา (ถ้าต้องการ)

---

## 🔄 **การอัปเดตในอนาคต**
- เพิ่มการแจ้งเตือน real-time
- เพิ่มการ export ข้อมูล
- เพิ่มการกรองเพิ่มเติม
- เพิ่มการแสดงสถิติ
- **เพิ่มการแจ้งเตือนเจ้าของเมื่อผู้เช่าแจ้งคืนสินค้า**
>>>>>>> ff04465 (Initial commit)
- **เพิ่มการติดตามสถานะการคืนสินค้าแบบ real-time** 