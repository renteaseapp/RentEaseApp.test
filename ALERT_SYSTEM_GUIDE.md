# Alert System Guide

## Overview
ระบบ Alert ใหม่ที่สวยงามและใช้งานง่ายสำหรับ RentEase Web Application

## Features
- ✅ **4 ประเภท Alert**: Success, Error, Warning, Info
- ✅ **Auto-dismiss**: ปิดอัตโนมัติตามเวลาที่กำหนด
- ✅ **Animation**: เอฟเฟกต์การเลื่อนและ fade in/out
- ✅ **Responsive**: รองรับทุกขนาดหน้าจอ
- ✅ **Accessibility**: รองรับ screen reader และ keyboard navigation
- ✅ **Internationalization**: รองรับหลายภาษา (EN/TH)
- ✅ **Toast-style**: แสดงที่มุมขวาบนของหน้าจอ

## Components

### 1. Alert Component
```tsx
import { Alert, SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from '../components/common/Alert';

// ใช้งานทั่วไป
<Alert 
  type="success"
  title="สำเร็จ"
  message="บันทึกข้อมูลเรียบร้อยแล้ว"
  onDismiss={() => console.log('dismissed')}
  autoDismiss={true}
  autoDismissDelay={5000}
/>

// ใช้งานแบบสะดวก
<SuccessAlert message="บันทึกข้อมูลเรียบร้อยแล้ว" />
<ErrorAlert message="เกิดข้อผิดพลาด" />
<WarningAlert message="กรุณาตรวจสอบข้อมูล" />
<InfoAlert message="ข้อมูลเพิ่มเติม" />
```

### 2. Alert Context (Recommended)
```tsx
import { useAlert } from '../contexts/AlertContext';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useAlert();

  const handleSubmit = async () => {
    try {
      await saveData();
      showSuccess('บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const showInfoMessage = () => {
    showInfo('นี่คือข้อมูลเพิ่มเติม');
  };

  const showWarningMessage = () => {
    showWarning('กรุณาตรวจสอบข้อมูลก่อนบันทึก');
  };
};
```

## Alert Types

### Success Alert
- **สี**: เขียว
- **ไอคอน**: ✓
- **Auto-dismiss**: 4 วินาที
- **ใช้เมื่อ**: การดำเนินการสำเร็จ

### Error Alert
- **สี**: แดง
- **ไอคอน**: ✗
- **Auto-dismiss**: ไม่ (ต้องปิดเอง)
- **ใช้เมื่อ**: เกิดข้อผิดพลาด

### Warning Alert
- **สี**: เหลือง
- **ไอคอน**: ⚠
- **Auto-dismiss**: 6 วินาที
- **ใช้เมื่อ**: คำเตือนหรือข้อมูลที่ควรระวัง

### Info Alert
- **สี**: น้ำเงิน
- **ไอคอน**: ℹ
- **Auto-dismiss**: 5 วินาที
- **ใช้เมื่อ**: ข้อมูลทั่วไป

## Usage Examples

### 1. Form Validation
```tsx
const handleSubmit = (formData) => {
  if (!formData.email) {
    showError('กรุณากรอกอีเมล');
    return;
  }
  
  if (!formData.password) {
    showError('กรุณากรอกรหัสผ่าน');
    return;
  }
  
  // Submit form
  showSuccess('ส่งข้อมูลเรียบร้อยแล้ว');
};
```

### 2. API Calls
```tsx
const fetchData = async () => {
  try {
    const response = await api.getData();
    showSuccess('โหลดข้อมูลเรียบร้อยแล้ว');
    return response.data;
  } catch (error) {
    showError('ไม่สามารถโหลดข้อมูลได้');
    console.error(error);
  }
};
```

### 3. File Upload
```tsx
const handleFileUpload = (file) => {
  if (file.size > 5 * 1024 * 1024) {
    showError('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    showError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
    return;
  }
  
  showSuccess('อัปโหลดไฟล์เรียบร้อยแล้ว');
};
```

### 4. User Actions
```tsx
const handleDelete = async (id) => {
  if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
    try {
      await deleteItem(id);
      showSuccess('ลบรายการเรียบร้อยแล้ว');
    } catch (error) {
      showError('ไม่สามารถลบรายการได้');
    }
  }
};
```

## Translation Keys

### English
```json
{
  "alerts": {
    "dismiss": "Dismiss",
    "successTitle": "Success",
    "errorTitle": "Error", 
    "warningTitle": "Warning",
    "infoTitle": "Information",
    "messages": {
      "productCreated": "Product created successfully!",
      "productUpdated": "Product updated successfully!",
      "loginSuccess": "Login successful!",
      "networkError": "Network error. Please check your connection.",
      "validationError": "Please check your input and try again."
    }
  }
}
```

### Thai
```json
{
  "alerts": {
    "dismiss": "ปิด",
    "successTitle": "สำเร็จ",
    "errorTitle": "ข้อผิดพลาด",
    "warningTitle": "คำเตือน", 
    "infoTitle": "ข้อมูล",
    "messages": {
      "productCreated": "สร้างสินค้าสำเร็จแล้ว!",
      "productUpdated": "อัปเดตสินค้าสำเร็จแล้ว!",
      "loginSuccess": "เข้าสู่ระบบสำเร็จ!",
      "networkError": "ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ",
      "validationError": "กรุณาตรวจสอบข้อมูลที่กรอกและลองใหม่อีกครั้ง"
    }
  }
}
```

## Migration from Old System

### Before (Old ErrorMessage)
```tsx
import { ErrorMessage } from '../components/common/ErrorMessage';

const [error, setError] = useState(null);
const [successMessage, setSuccessMessage] = useState(null);

// In JSX
{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
{successMessage && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{successMessage}</div>}

// In functions
setError('เกิดข้อผิดพลาด');
setSuccessMessage('สำเร็จแล้ว');
```

### After (New Alert System)
```tsx
import { useAlert } from '../contexts/AlertContext';

const { showError, showSuccess } = useAlert();

// In functions
showError('เกิดข้อผิดพลาด');
showSuccess('สำเร็จแล้ว');

// No need for JSX - alerts appear automatically
```

## Best Practices

1. **ใช้ Context มากกว่า Component**: ใช้ `useAlert()` hook แทนการ render Alert component โดยตรง
2. **ข้อความสั้นกระชับ**: เขียนข้อความให้เข้าใจง่ายและกระชับ
3. **ใช้ Translation**: ใช้ translation keys แทนข้อความ hardcode
4. **Error Handling**: จัดการ error ให้ครอบคลุมและแสดงข้อความที่ชัดเจน
5. **Success Feedback**: ให้ feedback ทันทีเมื่อการดำเนินการสำเร็จ
6. **Warning Usage**: ใช้ warning สำหรับข้อมูลที่ควรระวังแต่ไม่ใช่ error

## Customization

### Custom Styling
```tsx
<Alert
  type="success"
  message="Custom styled alert"
  className="my-custom-class"
/>
```

### Custom Auto-dismiss
```tsx
<Alert
  type="info"
  message="Custom dismiss time"
  autoDismiss={true}
  autoDismissDelay={10000} // 10 seconds
/>
```

### Without Icon
```tsx
<Alert
  type="success"
  message="Alert without icon"
  showIcon={false}
/>
```

## Accessibility Features

- **ARIA labels**: รองรับ screen readers
- **Keyboard navigation**: สามารถใช้ Tab และ Enter ได้
- **Focus management**: จัดการ focus อย่างเหมาะสม
- **Color contrast**: ใช้สีที่มี contrast ratio ที่ดี
- **Screen reader announcements**: แจ้งเตือนเมื่อมี alert ใหม่

## Performance Considerations

- **Auto-cleanup**: ลบ alerts อัตโนมัติเมื่อปิด
- **Memory management**: ไม่มี memory leaks
- **Efficient rendering**: ใช้ React.memo สำหรับ optimization
- **Bundle size**: ขนาดไฟล์เล็กและ optimize แล้ว 