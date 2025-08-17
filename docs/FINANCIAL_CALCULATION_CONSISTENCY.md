# Financial Calculation Consistency

## Overview
เอกสารนี้สรุปการคำนวณเงินให้ตรงกันในทุกหน้าที่เกี่ยวข้องกับการเงินในระบบ RentEase

## 🧮 Formula การคำนวณหลัก

### 1. **Subtotal (ค่าเช่ารวม)**
```
Subtotal = Rental Price Per Day × Rental Days
```

### 2. **Estimated Fees (ค่าธรรมเนียมโดยประมาณ)**
```
Platform Fee Renter = Subtotal × (Platform Fee Percentage / 100)
Platform Fee Owner = Subtotal × (Platform Fee Owner Percentage / 100)
Delivery Fee = Delivery Fee Base (เฉพาะเมื่อเลือก delivery)
Total Estimated Fees = Platform Fee Renter + Delivery Fee
```

### 3. **Total Amount (ยอดรวมที่ต้องชำระ)**
```
Total Amount = Subtotal + Security Deposit + Total Estimated Fees
```

## 📱 การคำนวณในแต่ละหน้า

### **ProductDetailPage.tsx** (หน้าหลักสำหรับการเช่า) ✅
```typescript
// คำนวณค่าเช่ารวม
const subtotal = calculateRentalSubtotal(product?.rental_price_per_day || 0, rentalDays);

// คำนวณยอดรวม
const totalAmount = calculateTotalAmount(subtotal, product?.security_deposit || 0, estimatedFees);

// ตรวจสอบระยะเวลาการเช่า
const durationValidation = validateRentalDuration(
  startDate, 
  endDate, 
  product.min_rental_duration_days || 1, 
  product.max_rental_duration_days || undefined
);
```

### **PaymentPage.tsx** ✅
```typescript
// แสดงข้อมูลจาก backend ที่คำนวณแล้ว
rental.calculated_subtotal_rental_fee  // ค่าเช่ารวม
rental.security_deposit_at_booking     // เงินประกัน
rental.delivery_fee                     // ค่าส่ง
rental.platform_fee_renter             // ค่าธรรมเนียมแพลตฟอร์ม
rental.total_amount_due                // ยอดรวมที่ต้องชำระ

// ใช้ formatCurrency สำหรับการแสดงผล
formatCurrency(rental.total_amount_due || 0)
```

### **OwnerRentalDetailPage.tsx** ⏳
```typescript
// ยังไม่ได้ปรับปรุง - ต้องใช้ utility functions ใหม่
```

### **RenterRentalDetailPage.tsx** ✅
```typescript
// ใช้ utility functions ใหม่แล้ว
formatCurrency(rental.rental_price_per_day_at_booking)
formatCurrency(rental.security_deposit_at_booking)
formatCurrency(rental.delivery_fee)
formatCurrency(rental.platform_fee_renter)
formatCurrency(rental.total_amount_due)
```

## 🔧 Backend Service

### **SettingsService.calculateEstimatedFees()**
```javascript
return {
  subtotal_rental_fee: subtotalRentalFee,
  platform_fee_renter: platformFeeRenter,
  platform_fee_owner: platformFeeOwner,
  delivery_fee: deliveryFee,
  total_estimated_fees: platformFeeRenter + deliveryFee,
  total_amount_estimate: subtotalRentalFee + platformFeeRenter + deliveryFee
};
```

## ⚠️ จุดที่ต้องระวัง

### 1. **การคำนวณใน Frontend vs Backend**
- **Frontend**: คำนวณเพื่อแสดงผลโดยประมาณ (estimated)
- **Backend**: คำนวณจริงเมื่อสร้าง Rental

### 2. **การแสดงผล Security Deposit**
- ต้องตรวจสอบว่า `product.security_deposit` มีค่าหรือไม่
- ใช้ `|| 0` เพื่อป้องกัน undefined

### 3. **การจัดการ null/undefined**
- ใช้ `|| 0` สำหรับค่าตัวเลข
- ใช้ `?.` สำหรับการเข้าถึง properties

## ✅ Checklist การตรวจสอบ

- [ ] Subtotal คำนวณตรงกันในทุกหน้า
- [ ] Security Deposit แสดงผลตรงกัน
- [ ] Estimated Fees คำนวณจาก service เดียวกัน
- [ ] Total Amount รวมค่าทั้งหมดตรงกัน
- [ ] การจัดการ null/undefined ถูกต้อง
- [ ] การแสดงผลสกุลเงิน (฿) ตรงกัน

## 🚀 การปรับปรุงที่แนะนำ

1. **สร้าง Utility Function** สำหรับการคำนวณเงิน
2. **ใช้ Constants** สำหรับค่าคงที่ทางการเงิน
3. **เพิ่ม Unit Tests** สำหรับการคำนวณเงิน
4. **สร้าง Type Definitions** ที่ชัดเจนสำหรับข้อมูลการเงิน
