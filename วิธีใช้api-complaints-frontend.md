Complaints API


## 1. เตรียมความพร้อม

- **Authentication:**
  - ทุก request ต้องแนบ JWT token ใน Header
    - User: Token จาก `/api/auth/login`
    - Admin: Token จาก `/api/admin/login`
  - ตัวอย่าง Header:
    ```
    Authorization: Bearer <access_token>
    ```

---

## 2. Complaints API สำหรับ User

### 2.1 แจ้งเรื่องร้องเรียนใหม่
- **Method:** `POST`
- **URL:** `/api/complaints`
- **Headers:**
  - `Authorization: Bearer <user_token>`
  - `Content-Type: multipart/form-data`
- **Body:**
  - `title` (string)
  - `details` (string)
  - `complaint_type` (string)
  - `related_rental_id` (number, optional)
  - `related_product_id` (number, optional)
  - `subject_user_id` (number, optional)
  - `attachments` (file, optional, แนบได้หลายไฟล์)
- **Request ตัวอย่าง (Postman):**
  - เลือก `form-data` ใส่ field ตามด้านบน
- **Response จริง:**
```json
{
	"statusCode": 201,
	"data": {
		"data": {
			"id": 4,
			"complaint_uid": "6899d5da-c809-4afb-bb61-53f4e940fbbe",
			"complainant_id": 7,
			"subject_user_id": 1,
			"related_rental_id": 15,
			"related_product_id": 39,
			"complaint_type": "ระเบิด",
			"title": "บอลเกย์",
			"details": "สินค้ามันดูเกย์ไป ไม่ได้เรื่องเลย",
			"status": "submitted",
			"admin_notes": null,
			"resolution_notes": null,
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-07-03T10:37:02.301036+00:00",
			"updated_at": "2025-07-03T10:37:02.301036+00:00",
			"resolved_at": null,
			"closed_at": null,
			"complaint_attachments": [
				{
					"id": 2,
					"file_url": "https://xjoumitfgcpjanwagvgk.supabase.co/storage/v1/object/public/complaint-attachments/public/complaint-4-1751539022962-6fbf6c0a-fdbe-482d-aa17-c29dcea5f181.png",
					"file_type": "image/png",
					"description": "6fbf6c0a-fdbe-482d-aa17-c29dcea5f181.png",
					"uploaded_at": "2025-07-03T10:37:03.128377+00:00",
					"complaint_id": 4,
					"uploaded_by_id": 7
				}
			],
			"complainant": {
				"id": 7,
				"last_name": "x",
				"first_name": "65011211019",
				"profile_picture_url": "https://xjoumitfgcpjanwagvgk.supabase.co/storage/v1/object/public/avatars/public/user-7-avatar-1751097626164.jpg"
			},
			"subject_user": {
				"id": 1,
				"last_name": "UserZero",
				"first_name": "UpdatedFirstName",
				"profile_picture_url": "https://xjoumitfgcpjanwagvgk.supabase.co/storage/v1/object/public/avatars/public/user-1-avatar-1748526293385.jpg"
			},
			"updates": []
		}
	},
	"message": "Complaint created successfully",
	"success": true
}
```

---

### 2.2 ดูรายการร้องเรียนของตัวเอง
- **Method:** `GET`
- **URL:** `/api/complaints/my?page=1&limit=10`
- **Headers:**
  - `Authorization: Bearer <user_token>`
- **Response จริง:**
{
	"statusCode": 200,
	"data": {
		"data": {
			"items": [
				{
					"id": 4,
					"complaint_uid": "6899d5da-c809-4afb-bb61-53f4e940fbbe",
					"complainant_id": 7,
					"subject_user_id": 1,
					"related_rental_id": 15,
					"related_product_id": 39,
					"complaint_type": "ระเบิด",
					"title": "บอลเกย์",
					"details": "สินค้ามันดูเกย์ไป ไม่ได้เรื่องเลย",
					"status": "submitted",
					"admin_notes": null,
					"resolution_notes": null,
					"admin_handler_id": null,
					"priority": "medium",
					"created_at": "2025-07-03T10:37:02.301036+00:00",
					"updated_at": "2025-07-03T10:37:02.301036+00:00",
					"resolved_at": null,
					"closed_at": null
				},
				{
					"id": 3,
					"complaint_uid": "5b8afe86-ca8a-422f-a83a-809f85a386d7",
					"complainant_id": 7,
					"subject_user_id": null,
					"related_rental_id": 14,
					"related_product_id": null,
					"complaint_type": "wrong_item",
					"title": "สินค้าผิดอัน",
					"details": "สั่ง mi13t pro ได้ pro 13t mi",
					"status": "closed_no_action",
					"admin_notes": "[User Update - 2025-07-03T08:56:29.073Z] ไม่บอกนะครับเบื่อ",
					"resolution_notes": "ไม่สนครับ",
					"admin_handler_id": null,
					"priority": "medium",
					"created_at": "2025-07-03T08:28:38.284192+00:00",
					"updated_at": "2025-07-03T09:08:10.503059+00:00",
					"resolved_at": null,
					"closed_at": null
				},
				{
					"id": 2,
					"complaint_uid": "d0dca329-5731-49f6-a9c5-0d099ef09668",
					"complainant_id": 7,
					"subject_user_id": null,
					"related_rental_id": null,
					"related_product_id": null,
					"complaint_type": "user_behavior",
					"title": "เเเเเเ",
					"details": "เดหกดหกดหเหเห54เฟ654เ6ฟโฤโ5ฤโ4โ",
					"status": "submitted",
					"admin_notes": null,
					"resolution_notes": null,
					"admin_handler_id": null,
					"priority": "medium",
					"created_at": "2025-06-30T09:29:40.713624+00:00",
					"updated_at": "2025-06-30T09:29:40.713624+00:00",
					"resolved_at": null,
					"closed_at": null
				},
				{
					"id": 1,
					"complaint_uid": "8946ff8a-d462-44f9-b0cf-a7128d87841f",
					"complainant_id": 7,
					"subject_user_id": null,
					"related_rental_id": null,
					"related_product_id": null,
					"complaint_type": "user_behavior",
					"title": "บอลเกย์",
					"details": "ผู้ใช้ชื่อบอลเกย์ผม5555555555555555555555555555555555555555555555555555555555555",
					"status": "submitted",
					"admin_notes": null,
					"resolution_notes": null,
					"admin_handler_id": null,
					"priority": "medium",
					"created_at": "2025-06-30T09:18:08.219929+00:00",
					"updated_at": "2025-06-30T09:18:08.219929+00:00",
					"resolved_at": null,
					"closed_at": null
				}
			],
			"total": 4,
			"page": 1,
			"limit": 10
		}
	},
	"message": "Success",
	"success": true
}
```

---

### 2.3 ดูรายละเอียดเรื่องร้องเรียน
- **Method:** `GET`
- **URL:** `/api/complaints/:complaintId`
- **Headers:**
  - `Authorization: Bearer <user_token>`
- **Response จริง:**
```json
{
	"statusCode": 200,
	"data": {
		"data": {
			"id": 1,
			"complaint_uid": "8946ff8a-d462-44f9-b0cf-a7128d87841f",
			"complainant_id": 7,
			"subject_user_id": null,
			"related_rental_id": null,
			"related_product_id": null,
			"complaint_type": "user_behavior",
			"title": "บอลเกย์",
			"details": "ผู้ใช้ชื่อบอลเกย์ผม5555555555555555555555555555555555555555555555555555555555555",
			"status": "submitted",
			"admin_notes": null,
			"resolution_notes": null,
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-06-30T09:18:08.219929+00:00",
			"updated_at": "2025-06-30T09:18:08.219929+00:00",
			"resolved_at": null,
			"closed_at": null,
			"complaint_attachments": [],
			"complainant": {
				"id": 7,
				"last_name": "x",
				"first_name": "65011211019",
				"profile_picture_url": "https://xjoumitfgcpjanwagvgk.supabase.co/storage/v1/object/public/avatars/public/user-7-avatar-1751097626164.jpg"
			},
			"subject_user": null,
			"updates": []
		}
	},
	"message": "Success",
	"success": true
}
```

---

## 3. Complaints API สำหรับ Admin

### 3.1 ดูรายการร้องเรียนทั้งหมด
- **Method:** `GET`
- **URL:** `/api/admin/complaints?page=1&limit=10`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Response จริง:**
```json
{
	"data": [
		{
			"id": 4,
			"complaint_uid": "6899d5da-c809-4afb-bb61-53f4e940fbbe",
			"complainant_id": 7,
			"subject_user_id": 1,
			"related_rental_id": 15,
			"related_product_id": 39,
			"complaint_type": "ระเบิด",
			"title": "บอลเกย์",
			"details": "สินค้ามันดูเกย์ไป ไม่ได้เรื่องเลย",
			"status": "submitted",
			"admin_notes": null,
			"resolution_notes": null,
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-07-03T10:37:02.301036+00:00",
			"updated_at": "2025-07-03T10:37:02.301036+00:00",
			"resolved_at": null,
			"closed_at": null
		},
		{
			"id": 3,
			"complaint_uid": "5b8afe86-ca8a-422f-a83a-809f85a386d7",
			"complainant_id": 7,
			"subject_user_id": null,
			"related_rental_id": 14,
			"related_product_id": null,
			"complaint_type": "wrong_item",
			"title": "สินค้าผิดอัน",
			"details": "สั่ง mi13t pro ได้ pro 13t mi",
			"status": "closed_no_action",
			"admin_notes": "[User Update - 2025-07-03T08:56:29.073Z] ไม่บอกนะครับเบื่อ",
			"resolution_notes": "ไม่สนครับ",
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-07-03T08:28:38.284192+00:00",
			"updated_at": "2025-07-03T09:08:10.503059+00:00",
			"resolved_at": null,
			"closed_at": null
		},
		{
			"id": 2,
			"complaint_uid": "d0dca329-5731-49f6-a9c5-0d099ef09668",
			"complainant_id": 7,
			"subject_user_id": null,
			"related_rental_id": null,
			"related_product_id": null,
			"complaint_type": "user_behavior",
			"title": "เเเเเเ",
			"details": "เดหกดหกดหเหเห54เฟ654เ6ฟโฤโ5ฤโ4โ",
			"status": "submitted",
			"admin_notes": null,
			"resolution_notes": null,
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-06-30T09:29:40.713624+00:00",
			"updated_at": "2025-06-30T09:29:40.713624+00:00",
			"resolved_at": null,
			"closed_at": null
		},
		{
			"id": 1,
			"complaint_uid": "8946ff8a-d462-44f9-b0cf-a7128d87841f",
			"complainant_id": 7,
			"subject_user_id": null,
			"related_rental_id": null,
			"related_product_id": null,
			"complaint_type": "user_behavior",
			"title": "บอลเกย์",
			"details": "ผู้ใช้ชื่อบอลเกย์ผม5555555555555555555555555555555555555555555555555555555555555",
			"status": "submitted",
			"admin_notes": "[User Update - 2025-07-03T10:42:12.249Z] ไม่บอกครับ",
			"resolution_notes": null,
			"admin_handler_id": null,
			"priority": "medium",
			"created_at": "2025-06-30T09:18:08.219929+00:00",
			"updated_at": "2025-07-03T10:42:11.817863+00:00",
			"resolved_at": null,
			"closed_at": null
		}
	],
	"meta": {
		"current_page": "1",
		"per_page": "10",
		"total": 4,
		"last_page": 1,
		"from": 1,
		"to": 4
	}
}
```

---

### 3.2 ดูรายละเอียดเรื่องร้องเรียน
- **Method:** `GET`
- **URL:** `/api/admin/complaints/:id`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Response จริง:**
```json
{
	"id": 1,
	"complaint_uid": "8946ff8a-d462-44f9-b0cf-a7128d87841f",
	"complainant_id": 7,
	"subject_user_id": null,
	"related_rental_id": null,
	"related_product_id": null,
	"complaint_type": "user_behavior",
	"title": "บอลเกย์",
	"details": "ผู้ใช้ชื่อบอลเกย์ผม5555555555555555555555555555555555555555555555555555555555555",
	"status": "submitted",
	"admin_notes": "[User Update - 2025-07-03T10:42:12.249Z] ไม่บอกครับ",
	"resolution_notes": null,
	"admin_handler_id": null,
	"priority": "medium",
	"created_at": "2025-06-30T09:18:08.219929+00:00",
	"updated_at": "2025-07-03T10:42:11.817863+00:00",
	"resolved_at": null,
	"closed_at": null
}
```

---

### 3.3 ตอบกลับ/อัปเดตสถานะเรื่องร้องเรียน
- **Method:** `PUT`
- **URL:** `/api/admin/complaints/:id/reply`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`
- **Body:**
  - `status` (string:submitted
under_review
awaiting_user_response
investigating
resolved
closed_no_action
closed_escalated_to_claim )
  - `resolution_notes` (string)
  -'admin_notes'(string)
- **Request ตัวอย่าง (Postman):**
  - เลือก `raw` JSON ใส่ field ตามด้านบน
- **Response จริง:**
```json
{
	"id": 1,
	"complaint_uid": "8946ff8a-d462-44f9-b0cf-a7128d87841f",
	"complainant_id": 7,
	"subject_user_id": null,
	"related_rental_id": null,
	"related_product_id": null,
	"complaint_type": "user_behavior",
	"title": "บอลเกย์",
	"details": "ผู้ใช้ชื่อบอลเกย์ผม5555555555555555555555555555555555555555555555555555555555555",
	"status": "under_review",
	"admin_notes": "ไม่บอกครับ ไม่บอกครับ",
	"resolution_notes": "ไม่บอก",
	"admin_handler_id": null,
	"priority": "medium",
	"created_at": "2025-06-30T09:18:08.219929+00:00",
	"updated_at": "2025-07-03T10:50:13.164606+00:00",
	"resolved_at": null,
	"closed_at": null
}
```

---

## 4. หมายเหตุสำคัญ

- ทุก request ต้องแนบ JWT token ที่ถูกต้อง
- ถ้าไม่มีสิทธิ์หรือข้อมูลไม่ถูกต้อง จะได้ response status 401/403/404 พร้อมข้อความ error จริงจากระบบ
- การแนบไฟล์ใน Postman ให้เลือก `form-data` และเพิ่ม field `attachments` (เลือกไฟล์)
- ทุก response จะได้ข้อมูลจริงจากฐานข้อมูล ไม่ใช่ mock

