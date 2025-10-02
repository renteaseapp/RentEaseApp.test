import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getOwnerProductForEdit, createProduct, updateProduct } from '../../services/ownerService';
import { getCategories, getProvinces } from '../../services/productService';
import { Product, Category, Province, ApiError, ProductAvailabilityStatus, ProductImage } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';

import { motion, } from 'framer-motion';
import { OpenStreetMapPicker } from "../../components/common/OpenStreetMapPicker";
import { 
  FaPlus,
  FaEdit,
  FaArrowLeft,
  FaBox,
  FaTag,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSave,
  FaFileAlt,
  FaInfoCircle,
  FaTrash
} from 'react-icons/fa';

type Specification = {
  key: string;
  value: string;
};

type ProductFormData = Partial<Omit<Product, 'id'|'owner'|'slug'|'created_at'|'updated_at'|'primary_image'|'images'|'category'|'province'>> & {
    imagesInput?: File[];
    removeImageIds?: number[];
};

// Helper function for Thai status options
const getProductStatusThai = (status: ProductAvailabilityStatus): string => {
  switch (status) {
    case ProductAvailabilityStatus.AVAILABLE: return 'พร้อมให้เช่า';
    case ProductAvailabilityStatus.UNAVAILABLE: return 'ไม่พร้อมให้เช่า';
    case ProductAvailabilityStatus.DRAFT: return 'ฉบับร่าง';
    case ProductAvailabilityStatus.RENTED_OUT: return 'ถูกเช่าออกไป'; // นี้ไม่ควรปรากฏใน dropdown แต่มีไว้เพื่อความสมบูรณ์
    case ProductAvailabilityStatus.PENDING_APPROVAL: return 'รอการอนุมัติ'; // นี้ไม่ควรปรากฏใน dropdown แต่มีไว้เพื่อความสมบูรณ์
    default: return status;
  }
};

export const ProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category_id: undefined,
    province_id: undefined,
    rental_price_per_day: 0,
    quantity: 1,
    quantity_available: 1, // เพิ่ม quantity_available
    availability_status: ProductAvailabilityStatus.DRAFT,
    specifications: undefined, // Ensure specifications is part of the initial state
  });
  const [specifications, setSpecifications] = useState<Specification[]>([{ key: '', value: '' }]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const isEditMode = Boolean(productId);

  useEffect(() => {
    const fetchDropdownData = async () => {
        try {
            const [catsRes, provRes] = await Promise.all([getCategories(), getProvinces()]);
            setCategories(catsRes.data);
            setProvinces(provRes.data);
        } catch (err) {
            showError("ไม่สามารถโหลดหมวดหมู่สินค้าได้");
        }
    };
    fetchDropdownData();

    if (isEditMode && user?.id && productId) {
      setIsFetchingDetails(true);
      getOwnerProductForEdit(Number(productId), user.id)
        .then(product => {
          setFormData({
            title: product.title,
            description: product.description || '',
            category_id: product.category_id,
            province_id: product.province_id,
            rental_price_per_day: product.rental_price_per_day,
            rental_price_per_week: product.rental_price_per_week || undefined,
            rental_price_per_month: product.rental_price_per_month || undefined,
            security_deposit: product.security_deposit || undefined,
            quantity: product.quantity || 1,
            quantity_available: product.quantity_available || product.quantity || 1,
            min_rental_duration_days: product.min_rental_duration_days || 1,
            max_rental_duration_days: product.max_rental_duration_days || undefined,
            latitude: product.latitude || undefined,
            longitude: product.longitude || undefined,
            address_details: product.address_details || '',
            condition_notes: product.condition_notes || '',
            specifications: product.specifications || undefined, // Initialize with object or undefined
            availability_status: product.availability_status || ProductAvailabilityStatus.DRAFT,
          });
          if (product.specifications) {
            const specsArray = Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }));
            setSpecifications(specsArray.length > 0 ? specsArray : [{ key: '', value: '' }]);
          }
          setExistingImages(product.images || (product.primary_image ? [product.primary_image] : []));
          setRemovedImageIds([]); // Reset removed image IDs
        })
        .catch(err => showError((err as ApiError).message || "ไม่สามารถโหลดรายละเอียดสินค้าได้"))
        .finally(() => setIsFetchingDetails(false));
    }
  }, [productId, user, isEditMode, showError]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecifications = [...specifications];
    newSpecifications[index][field] = value;
    setSpecifications(newSpecifications);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    const newSpecifications = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecifications.length > 0 ? newSpecifications : [{ key: '', value: '' }]);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        showError("ไฟล์รูปภาพมีขนาดใหญ่เกินกว่า 5MB");
        return;
      }
      
      // Check if we haven't reached the limit
      if ((formData.imagesInput?.length || 0) + existingImages.length >= 10) {
        showError("อัปโหลดรูปภาพได้สูงสุด 10 รูป");
        return;
      }
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews(prev => [...prev, previewUrl]);
      
      // Add to form data
      setFormData(prev => ({
        ...prev,
        imagesInput: [...(prev.imagesInput || []), file]
      }));
      
      // Clear the input
      e.target.value = '';
    }
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      // Remove from existing images and track the ID
      const imageToRemove = existingImages[index];
      if (imageToRemove.id) {
        setRemovedImageIds(prev => [...prev, imageToRemove.id!]);
      }
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
        // Remove from new images and their previews
        setFormData(prev => ({
            ...prev,
            imagesInput: prev.imagesInput?.filter((_, i) => i !== index)
        }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showError("ผู้ใช้ไม่ได้เข้าสู่ระบบ");
      return;
    }
    if(!formData.title || !formData.category_id || !formData.province_id || !formData.rental_price_per_day) {
        showError("กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) ให้ครบถ้วน");
        return;
    }

    // Validate required fields
    if (!formData.title || formData.title.trim().length === 0) {
        showError("กรุณากรอกชื่อสินค้า");
        return;
    }
    if (formData.title.length > 255) {
        showError("ชื่อสินค้าต้องมีความยาวไม่เกิน 255 ตัวอักษร");
        return;
    }
    if (!formData.category_id) {
        showError("กรุณาเลือกหมวดหมู่สินค้า");
        return;
    }
    if (!formData.province_id) {
        showError("กรุณาเลือกจังหวัด");
        return;
    }
    if (!formData.description || formData.description.trim().length === 0) {
        showError("กรุณากรอกคำอธิบายสินค้า");
        return;
    }
    if (!formData.rental_price_per_day || formData.rental_price_per_day <= 0) {
        showError("กรุณากรอกราคาเช่าต่อวัน (ต้องมากกว่า 0)");
        return;
    }
    if (formData.rental_price_per_day > 999999.99) {
        showError("ราคาเช่าต่อวันต้องไม่เกิน 999,999.99 บาท");
        return;
    }
    if (!formData.quantity_available || formData.quantity_available < 1) {
        showError("จำนวนสินค้าที่มีให้เช่าต้องมีอย่างน้อย 1 ชิ้น");
        return;
    }
    if (!formData.min_rental_duration_days || formData.min_rental_duration_days < 1) {
        showError("ระยะเวลาเช่าขั้นต่ำต้องมีอย่างน้อย 1 วัน");
        return;
    }
    if (formData.max_rental_duration_days && formData.max_rental_duration_days < formData.min_rental_duration_days) {
        showError("ระยะเวลาเช่าสูงสุดต้องมากกว่าหรือเท่ากับระยะเวลาเช่าขั้นต่ำ");
        return;
    }
    if (formData.address_details && formData.address_details.length > 255) {
        showError("รายละเอียดที่อยู่ต้องมีความยาวไม่เกิน 255 ตัวอักษร");
        return;
    }
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
        showError("ค่าละติจูดไม่ถูกต้อง (ต้องอยู่ระหว่าง -90 ถึง 90)");
        return;
    }
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
        showError("ค่าลองจิจูดไม่ถูกต้อง (ต้องอยู่ระหว่าง -180 ถึง 180)");
        return;
    }
    if (formData.rental_price_per_week && formData.rental_price_per_week > 999999.99) {
        showError("ราคาเช่าต่อสัปดาห์ต้องไม่เกิน 999,999.99 บาท");
        return;
    }
    if (formData.rental_price_per_month && formData.rental_price_per_month > 999999.99) {
        showError("ราคาเช่าต่อเดือนต้องไม่เกิน 999,999.99 บาท");
        return;
    }
    if (formData.security_deposit && formData.security_deposit > 999999.99) {
        showError("เงินประกันต้องไม่เกิน 999,999.99 บาท");
        return;
    }

    // Validate images (minimum 3 images required)
    const totalImages = (formData.imagesInput?.length || 0) + existingImages.length;
    if (totalImages < 3) {
        showError(`ต้องมีรูปภาพสินค้าอย่างน้อย 3 รูป (มีอยู่ ${totalImages} รูป)`);
        return;
    }
    if (totalImages > 10) {
        showError("อัปโหลดรูปภาพได้สูงสุด 10 รูป");
        return;
    }

    setIsLoading(true);

    // Convert specifications array to JSON object
    const finalSpecifications = specifications.reduce((acc, spec) => {
      if (spec.key.trim() && spec.value.trim()) {
        acc[spec.key.trim()] = spec.value.trim();
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Create the data payload for submission
    const currentFormData: ProductFormData = { 
        ...formData, 
        specifications: finalSpecifications,
        removeImageIds: removedImageIds,
        // quantity is set to be the same as quantity_available for simplicity in this logic
        quantity: formData.quantity_available 
    };

    // Debug: Log the data being sent
    console.log('Submitting form data:', currentFormData);
    console.log('Images input:', currentFormData.imagesInput);
    console.log('Specifications:', finalSpecifications);

    try {
      if (isEditMode && productId) {
        await updateProduct(Number(productId), user.id, currentFormData);
        showSuccess("อัปเดตสินค้าสำเร็จ");
      } else {
        await createProduct(user.id, currentFormData as any);
        showSuccess("สร้างสินค้าใหม่สำเร็จ");
      }
      setTimeout(() => navigate(ROUTE_PATHS.MY_LISTINGS), 1500);
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || (isEditMode ? "ไม่สามารถอัปเดตสินค้าได้" : "ไม่สามารถสร้างสินค้าได้"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingDetails) return <LoadingSpinner message={"กำลังโหลดรายละเอียดสินค้า..."} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                {isEditMode ? <FaEdit className="h-8 w-8 text-white" /> : <FaPlus className="h-8 w-8 text-white" />}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {isEditMode ? "แก้ไขสินค้า" : "สร้างสินค้าใหม่"}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditMode ? "ปรับปรุงข้อมูลสินค้าของคุณ" : "กรอกรายละเอียดสินค้าให้ครบถ้วนเพื่อลงประกาศ"}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={ROUTE_PATHS.MY_LISTINGS}>
                <Button variant="primary" className="bg-white text-black hover:bg-blue-50 hover:text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg">
                  <FaArrowLeft className="h-4 w-4 mr-2" />
                  {"กลับไปหน้ารายการสินค้า"}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
        {/* Required fields section header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaInfoCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                <span>{"กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจัน"}</span>
                <span className="text-red-500 ml-1">*</span> {"ให้ครบถ้วน"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaBox className="h-4 w-4 text-blue-500" />
            {"ชื่อสินค้า"} <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title || ''}
            onChange={handleChange}
            required
            placeholder={"ชื่อสินค้าที่ชัดเจนและน่าสนใจ"}
            maxLength={255}
            className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaFileAlt className="h-4 w-4 text-blue-500" />
            {"คำอธิบายสินค้า"} <span className="text-red-500">*</span>
          </label>
          <textarea 
            name="description" 
            id="description" 
            value={formData.description || ''} 
            onChange={handleChange} 
            rows={4} 
            className="block w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" 
            placeholder={"อธิบายคุณสมบัติและสภาพสินค้าอย่างละเอียด"}
            required
          ></textarea>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            <div>
                <label htmlFor="category_id" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaTag className="h-4 w-4 text-blue-500" />
                  {"หมวดหมู่"} <span className="text-red-500">*</span>
                </label>
                <select name="category_id" id="category_id" value={formData.category_id || ''} onChange={handleChange} required className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="">{"เลือกหมวดหมู่"}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="province_id" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-blue-500" />
                  {"จังหวัดที่ตั้งสินค้า"} <span className="text-red-500">*</span>
                </label>
                <select name="province_id" id="province_id" value={formData.province_id || ''} onChange={handleChange} required className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="">{"เลือกจังหวัด"}</option>
                    {provinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name_th}</option>)}
                </select>
            </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            <div>
              <label htmlFor="rental_price_per_day" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaMoneyBillWave className="h-4 w-4 text-green-500" />
                {"ราคาเช่าต่อวัน"} (฿) <span className="text-red-500">*</span>
              </label>
              <input
                id="rental_price_per_day"
                name="rental_price_per_day"
                type="number"
                value={formData.rental_price_per_day || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="rental_price_per_week" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="h-4 w-4 text-blue-500" />
                {"ราคาเช่าต่อสัปดาห์"} (฿)
              </label>
              <input
                id="rental_price_per_week"
                name="rental_price_per_week"
                type="number"
                value={formData.rental_price_per_week || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="rental_price_per_month" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="h-4 w-4 text-purple-500" />
                {"ราคาเช่าต่อเดือน"} (฿)
              </label>
              <input
                id="rental_price_per_month"
                name="rental_price_per_month"
                type="number"
                value={formData.rental_price_per_month || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={"เงินประกัน (฿)"} name="security_deposit" type="number" value={formData.security_deposit || ''} onChange={handleChange} min="0" step="0.01" />
            <div>
              <label htmlFor="quantity_available" className="block text-sm font-semibold text-gray-700 mb-1">
                {"จำนวนสินค้าที่มีให้เช่า"} <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity_available"
                name="quantity_available"
                type="number"
                value={formData.quantity_available || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : Number(value);
                  setFormData(prev => ({ 
                    ...prev, 
                    quantity_available: numValue,
                    quantity: numValue // ตั้งค่า quantity = quantity_available
                  }));
                }}
                required
                min="1"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-1 text-sm text-gray-500">
                {"จำนวนสินค้าที่คุณมีให้เช่าจริง (จะถูกใช้เป็นจำนวนคงคลัง)"}
              </p>
              {isEditMode && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">{"จำนวนสินค้าทั้งหมด"} (ไม่สามารถแก้ไขได้):</span> {formData.quantity || 1} {"ชิ้น"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {"ระบบจะใช้ 'จำนวนสินค้าที่มีให้เช่า' เป็นจำนวนคงคลังที่สามารถจองได้"}
                  </p>
                </div>
              )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={"ระยะเวลาเช่าขั้นต่ำ (วัน)"} name="min_rental_duration_days" type="number" value={formData.min_rental_duration_days || ''} onChange={handleChange} min="1" />
            <InputField label={"ระยะเวลาเช่าสูงสุด (วัน)"} name="max_rental_duration_days" type="number" value={formData.max_rental_duration_days || ''} onChange={handleChange} min="1" />
        </div>
        
        <div>
            <InputField label={"รายละเอียดที่อยู่รับ-ส่งสินค้า"} name="address_details" value={formData.address_details || ''} onChange={handleChange} placeholder={"เช่น บ้านเลขที่, ถนน, ซอย"} maxLength={255} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={"ละติจูด (Latitude)"} name="latitude" type="number" value={formData.latitude || ''} onChange={handleChange} step="any" min="-90" max="90" placeholder={"เช่น 13.7563"} />
            <InputField label={"ลองจิจูด (Longitude)"} name="longitude" type="number" value={formData.longitude || ''} onChange={handleChange} step="any" min="-180" max="180" placeholder={"เช่น 100.5018"} />
        </div>
        <p className="text-xs text-gray-500 -mt-4">{"กรอกพิกัดเพื่อแสดงตำแหน่งสินค้าบนแผนที่ หรือใช้ตัวเลือกแผนที่ด้านล่าง"}</p>
        
        {/* Google Maps Location Picker (OpenStreetMapPicker in this case) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaMapMarkerAlt className="h-4 w-4 text-blue-500" />
            {"เลือกตำแหน่งบนแผนที่"}
          </label>
          <OpenStreetMapPicker
            onLocationSelect={(location) => {
              setFormData(prev => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng,
                address_details: location.address || prev.address_details
              }));
            }}
            initialLocation={formData.latitude && formData.longitude ? {
              lat: Number(formData.latitude),
              lng: Number(formData.longitude)
            } : undefined}
            height="300px"
          />
        </div>
        
        <InputField label={"หมายเหตุ/สภาพสินค้าปัจจุบัน"} name="condition_notes" value={formData.condition_notes || ''} onChange={handleChange} placeholder={"ระบุสภาพสินค้า เช่น มีรอยขีดข่วนเล็กน้อย, ใช้งานได้ 100%"} />
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaInfoCircle className="h-4 w-4 text-blue-500" />
            {"รายละเอียดเฉพาะ (Specifications)"}
          </label>
          <div className="space-y-4">
            {specifications.map((spec, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border"
              >
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  placeholder={"ชื่อรายละเอียด เช่น รุ่น, สี"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  placeholder={"ค่าของรายละเอียด เช่น A90, สีดำ"}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <motion.button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  whileHover={{ scale: 1.1, color: '#EF4444' }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title={"ลบรายการ"}
                >
                  <FaTrash className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
          <motion.button
            type="button"
            onClick={addSpecification}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-2 px-4 rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <FaPlus className="h-3 w-3" />
            {"เพิ่มรายละเอียด"}
          </motion.button>
        </div>

        <div>
            <label htmlFor="imagesInput" className="block text-sm font-semibold text-gray-700 mb-1">
                {"รูปภาพสินค้า"} <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                    {((formData.imagesInput?.length || 0) + existingImages.length)}/{"10 รูป"}
                </span>
            </label>
            <input 
                type="file" 
                name="imagesInput" 
                id="imagesInput" 
                onChange={handleImageChange} 
                accept="image/*" 
                disabled={((formData.imagesInput?.length || 0) + existingImages.length) >= 10}
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${((formData.imagesInput?.length || 0) + existingImages.length) >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="text-xs text-gray-500 mt-1">{"อัปโหลดรูปภาพสินค้าอย่างน้อย 3 รูป (ขนาดสูงสุด 5MB ต่อรูป)"}</p>
            {((formData.imagesInput?.length || 0) + existingImages.length) >= 10 && (
                <p className="text-xs text-blue-500 mt-1">{"อัปโหลดรูปภาพครบตามจำนวนสูงสุดแล้ว"}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
                {existingImages.map((img, index) => (
                    <div key={img.id || img.image_url} className="relative">
                        <img src={img.image_url} alt="Existing" className="h-24 w-24 object-cover rounded border" />
                        <button
                            type="button"
                            onClick={() => removeImage(index, true)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title={"ลบรูปภาพ"}
                        >
                            ×
                        </button>
                    </div>
                ))}
                {imagePreviews.map((preview, index) => (
                    <div key={preview} className="relative">
                        <img src={preview} alt="Preview" className="h-24 w-24 object-cover rounded border" />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title={"ลบรูปภาพ"}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            {((formData.imagesInput?.length || 0) + existingImages.length) < 3 && (
                <p className="text-xs text-red-500 mt-1">
                    {`ต้องเพิ่มรูปภาพอีก ${3 - ((formData.imagesInput?.length || 0) + existingImages.length)} รูปเป็นอย่างน้อย`}
                </p>
            )}
        </div>

        <div>
            <label htmlFor="availability_status" className="block text-sm font-semibold text-gray-700 mb-1">
              {"สถานะการใช้งานสินค้า"} <span className="text-red-500">*</span>
            </label>
            <select name="availability_status" id="availability_status" value={formData.availability_status || ''} onChange={handleChange} required className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {Object.values(ProductAvailabilityStatus).filter(s => s !== ProductAvailabilityStatus.RENTED_OUT && s !== ProductAvailabilityStatus.PENDING_APPROVAL).map(status => (
                    <option key={status} value={status}>{getProductStatusThai(status)}</option>
                ))}
            </select>
        </div>

        <div className="pt-6">
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isEditMode ? "กำลังบันทึก..." : "กำลังสร้างสินค้า..."}
              </>
            ) : (
              <>
                {isEditMode ? <FaSave className="h-5 w-5" /> : <FaPlus className="h-5 w-5" />}
                {isEditMode ? "บันทึกการเปลี่ยนแปลง" : "สร้างสินค้า"}
              </>
            )}
          </motion.button>
        </div>
        </motion.form>
      </div>
    </div>
  );
};