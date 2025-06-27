import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { createProduct, updateProduct, getOwnerProductForEdit } from '../../services/ownerService';
import { getCategories, getProvinces } from '../../services/productService';
import { Product, Category, Province, ApiError, ProductAvailabilityStatus, ProductImage } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

type ProductFormData = Partial<Omit<Product, 'id'|'owner'|'slug'|'created_at'|'updated_at'|'primary_image'|'images'|'category'|'province'>> & {
    imagesInput?: File[];
    removeImageIds?: number[];
};

export const ProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category_id: undefined,
    province_id: undefined,
    rental_price_per_day: 0,
    quantity: 1,
    availability_status: ProductAvailabilityStatus.DRAFT,
    specifications: undefined, // Ensure specifications is part of the initial state
  });
  const [specificationsString, setSpecificationsString] = useState<string>(''); // State for raw string input
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
            showError(t('productFormPage.generalErrors.failedToLoadCategories'));
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
            min_rental_duration_days: product.min_rental_duration_days || 1,
            max_rental_duration_days: product.max_rental_duration_days || undefined,
            latitude: product.latitude || undefined,
            longitude: product.longitude || undefined,
            address_details: product.address_details || '',
            condition_notes: product.condition_notes || '',
            specifications: product.specifications || undefined, // Initialize with object or undefined
            availability_status: product.availability_status || ProductAvailabilityStatus.DRAFT,
          });
          setSpecificationsString(product.specifications ? JSON.stringify(product.specifications, null, 2) : '');
          setExistingImages(product.images || (product.primary_image ? [product.primary_image] : []));
          setRemovedImageIds([]); // Reset removed image IDs
        })
        .catch(err => showError((err as ApiError).message || t('productFormPage.generalErrors.failedToLoadProduct')))
        .finally(() => setIsFetchingDetails(false));
    }
  }, [productId, user, isEditMode, showError, t]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "specifications") {
        setSpecificationsString(value); // Always update the raw string state
        try {
            const parsedJson = JSON.parse(value);
            if (typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson)) {
                setFormData(prev => ({ ...prev, specifications: parsedJson }));
            } else {
                // Valid JSON, but not a key-value object (e.g. "true", "123", "\"string\"").
                setFormData(prev => ({ ...prev, specifications: undefined }));
            }
        } catch (parseError) {
            // Invalid JSON syntax.
            setFormData(prev => ({ ...prev, specifications: undefined }));
        }
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        showError(t('productFormPage.validationErrors.imageFileTooLarge'));
        return;
      }
      
      // Check if we haven't reached the limit
      if ((formData.imagesInput?.length || 0) + existingImages.length >= 10) {
        showError(t('productFormPage.validationErrors.maxImagesExceeded'));
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
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      showError(t('productFormPage.generalErrors.userNotAuthenticated'));
      return;
    }
    if(!formData.title || !formData.category_id || !formData.province_id || !formData.rental_price_per_day) {
        showError(t('productFormPage.generalErrors.requiredFieldsMissing'));
        return;
    }

    // Validate required fields
    if (!formData.title || formData.title.trim().length === 0) {
        showError(t('productFormPage.validationErrors.titleRequired'));
        return;
    }
    if (formData.title.length > 255) {
        showError(t('productFormPage.validationErrors.titleTooLong'));
        return;
    }
    if (!formData.category_id) {
        showError(t('productFormPage.validationErrors.categoryRequired'));
        return;
    }
    if (!formData.province_id) {
        showError(t('productFormPage.validationErrors.provinceRequired'));
        return;
    }
    if (!formData.description || formData.description.trim().length === 0) {
        showError(t('productFormPage.validationErrors.descriptionRequired'));
        return;
    }
    if (!formData.rental_price_per_day || formData.rental_price_per_day <= 0) {
        showError(t('productFormPage.validationErrors.priceRequired'));
        return;
    }
    if (formData.rental_price_per_day > 999999.99) {
        showError(t('productFormPage.validationErrors.priceTooHigh'));
        return;
    }
    if (!formData.quantity || formData.quantity < 0) {
        showError(t('productFormPage.validationErrors.quantityInvalid'));
        return;
    }
    if (!formData.min_rental_duration_days || formData.min_rental_duration_days < 1) {
        showError(t('productFormPage.validationErrors.minRentalDurationInvalid'));
        return;
    }
    if (formData.max_rental_duration_days && formData.max_rental_duration_days < formData.min_rental_duration_days) {
        showError(t('productFormPage.validationErrors.maxRentalDurationInvalid'));
        return;
    }
    if (formData.address_details && formData.address_details.length > 255) {
        showError(t('productFormPage.validationErrors.addressTooLong'));
        return;
    }
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
        showError(t('productFormPage.validationErrors.latitudeInvalid'));
        return;
    }
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
        showError(t('productFormPage.validationErrors.longitudeInvalid'));
        return;
    }
    if (formData.rental_price_per_week && formData.rental_price_per_week > 999999.99) {
        showError(t('productFormPage.validationErrors.weeklyPriceTooHigh'));
        return;
    }
    if (formData.rental_price_per_month && formData.rental_price_per_month > 999999.99) {
        showError(t('productFormPage.validationErrors.monthlyPriceTooHigh'));
        return;
    }
    if (formData.security_deposit && formData.security_deposit > 999999.99) {
        showError(t('productFormPage.validationErrors.securityDepositTooHigh'));
        return;
    }

    // Validate images (minimum 3 images required)
    const remainingExistingImages = existingImages.length;
    const totalImages = (formData.imagesInput?.length || 0) + remainingExistingImages;
    if (totalImages < 3) {
        showError(t('productFormPage.validationErrors.minImagesRequired'));
        return;
    }
    if (totalImages > 10) {
        showError(t('productFormPage.validationErrors.maxImagesExceeded'));
        return;
    }

    setIsLoading(true);

    // Validate specificationsString before proceeding with submission
    let finalSpecifications: Record<string, any> | undefined = undefined;
    if (specificationsString.trim() !== '') {
        try {
            const parsedSpecs = JSON.parse(specificationsString);
            if (typeof parsedSpecs === 'object' && parsedSpecs !== null && !Array.isArray(parsedSpecs)) {
                finalSpecifications = parsedSpecs;
            } else {
                showError(t('productFormPage.validationErrors.invalidJsonSpecifications'));
                setIsLoading(false);
                return;
            }
        } catch (parseError) {
            showError(t('productFormPage.validationErrors.invalidJsonFormat'));
            setIsLoading(false);
            return;
        }
    }
    
    // Ensure formData reflects the validated specifications
    const currentFormData = { ...formData, specifications: finalSpecifications };

    try {
      let savedProduct: Product;
      if (isEditMode && productId) {
        // For updateProduct, the payload is ProductFormData which includes imagesInput
        // and correctly typed specifications (object or undefined).
        const updatePayload: ProductFormData = {
            ...currentFormData,
            ...(removedImageIds.length > 0 && { removeImageIds: removedImageIds }),
        };
        savedProduct = await updateProduct(Number(productId), user.id, updatePayload);
        showSuccess(t('productFormPage.productUpdatedSuccess'));
      } else {
        // For createProduct, map fields and handle `images` from `imagesInput`.
        // The type expected by createProduct service
        type CreateProductPayload = Omit<Product, 'id' | 'owner_id' | 'slug' | 'created_at' | 'updated_at' | 'owner' | 'province' | 'category' | 'primary_image' | 'view_count' | 'admin_approval_status' | 'images'> & { images?: File[] };
        
        const createPayload: CreateProductPayload = {
            title: currentFormData.title!,
            description: currentFormData.description,
            category_id: currentFormData.category_id!,
            province_id: currentFormData.province_id!,
            rental_price_per_day: currentFormData.rental_price_per_day!,
            rental_price_per_week: currentFormData.rental_price_per_week,
            rental_price_per_month: currentFormData.rental_price_per_month,
            security_deposit: currentFormData.security_deposit,
            quantity: currentFormData.quantity,
            min_rental_duration_days: currentFormData.min_rental_duration_days,
            max_rental_duration_days: currentFormData.max_rental_duration_days,
            latitude: currentFormData.latitude,
            longitude: currentFormData.longitude,
            address_details: currentFormData.address_details,
            condition_notes: currentFormData.condition_notes,
            specifications: currentFormData.specifications, // This is now object or undefined
            availability_status: currentFormData.availability_status,
        };
        if (currentFormData.imagesInput && currentFormData.imagesInput.length > 0) {
            createPayload.images = currentFormData.imagesInput;
        }
        savedProduct = await createProduct(user.id, createPayload);
        showSuccess(t('productFormPage.productCreatedSuccess'));
      }
      setTimeout(() => navigate(ROUTE_PATHS.MY_LISTINGS), 1500);
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || (isEditMode ? t('productFormPage.generalErrors.failedToUpdate') : t('productFormPage.generalErrors.failedToCreate')));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingDetails) return <LoadingSpinner message={t('productFormPage.loadingProductDetails')} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditMode ? t('productFormPage.editTitle') : t('productFormPage.title')}
      </h1>
      <Link to={ROUTE_PATHS.MY_LISTINGS} className="text-blue-600 hover:underline mb-6 block">{t('productFormPage.backToListings')}</Link>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
        {/* Required fields section header */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">{t('productFormPage.requiredFieldsInfo')}</span>
                <span className="text-red-500 ml-1">*</span> {t('productFormPage.requiredFieldsNote')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('productFormPage.titleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title || ''}
            onChange={handleChange}
            required
            placeholder={t('productFormPage.titlePlaceholder')}
            maxLength={255}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t('productFormPage.descriptionLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea 
              name="description" 
              id="description" 
              value={formData.description || ''} 
              onChange={handleChange} 
              rows={4} 
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
              placeholder={t('productFormPage.descriptionPlaceholder')}
              required
            ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('productFormPage.categoryLabel')} <span className="text-red-500">*</span>
                </label>
                <select name="category_id" id="category_id" value={formData.category_id || ''} onChange={handleChange} required className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('productFormPage.selectCategory')}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="province_id" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('productFormPage.provinceLabel')} <span className="text-red-500">*</span>
                </label>
                <select name="province_id" id="province_id" value={formData.province_id || ''} onChange={handleChange} required className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('productFormPage.selectProvince')}</option>
                    {provinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name_th}</option>)}
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="rental_price_per_day" className="block text-sm font-medium text-gray-700 mb-1">
                {t('productFormPage.pricePerDayLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="rental_price_per_day"
                name="rental_price_per_day"
                type="number"
                value={formData.rental_price_per_day || ''}
                onChange={handleChange}
                required
                min="0"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <InputField label={t('productFormPage.pricePerWeekLabel')} name="rental_price_per_week" type="number" value={formData.rental_price_per_week || ''} onChange={handleChange} min="0" />
            <InputField label={t('productFormPage.pricePerMonthLabel')} name="rental_price_per_month" type="number" value={formData.rental_price_per_month || ''} onChange={handleChange} min="0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={t('productFormPage.securityDepositLabel')} name="security_deposit" type="number" value={formData.security_deposit || ''} onChange={handleChange} min="0" />
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                {t('productFormPage.quantityLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity || ''}
                onChange={handleChange}
                required
                min="1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={t('productFormPage.minRentalDurationLabel')} name="min_rental_duration_days" type="number" value={formData.min_rental_duration_days || ''} onChange={handleChange} min="1" />
            <InputField label={t('productFormPage.maxRentalDurationLabel')} name="max_rental_duration_days" type="number" value={formData.max_rental_duration_days || ''} onChange={handleChange} min="1" />
        </div>
        
        <div>
            <InputField label={t('productFormPage.addressDetailsLabel')} name="address_details" value={formData.address_details || ''} onChange={handleChange} placeholder={t('productFormPage.addressDetailsPlaceholder')} maxLength={255} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label={t('productFormPage.latitudeLabel')} name="latitude" type="number" value={formData.latitude || ''} onChange={handleChange} step="any" min="-90" max="90" placeholder={t('productFormPage.latitudePlaceholder')} />
            <InputField label={t('productFormPage.longitudeLabel')} name="longitude" type="number" value={formData.longitude || ''} onChange={handleChange} step="any" min="-180" max="180" placeholder={t('productFormPage.longitudePlaceholder')} />
        </div>
        <p className="text-xs text-gray-500 -mt-4">{t('productFormPage.coordinatesHelp')}</p>
        
        <InputField label={t('productFormPage.conditionNotesLabel')} name="condition_notes" value={formData.condition_notes || ''} onChange={handleChange} placeholder={t('productFormPage.conditionNotesPlaceholder')} />
        
        <div>
            <label htmlFor="specifications" className="block text-sm font-medium text-gray-700 mb-1">{t('productFormPage.specificationsLabel')}</label>
            <textarea 
                name="specifications" 
                id="specifications" 
                value={specificationsString} 
                onChange={handleChange} 
                rows={3} 
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm" 
                placeholder={t('productFormPage.specificationsPlaceholder')}></textarea>
            <p className="text-xs text-gray-500 mt-1">{t('productFormPage.specificationsHelp')}</p>
        </div>

        <div>
            <label htmlFor="imagesInput" className="block text-sm font-medium text-gray-700 mb-1">
                {t('productFormPage.imagesLabel')} <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                    {((formData.imagesInput?.length || 0) + existingImages.length)}/{t('productFormPage.maxImagesCount')}
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
            <p className="text-xs text-gray-500 mt-1">{t('productFormPage.imagesHelp')}</p>
            {((formData.imagesInput?.length || 0) + existingImages.length) >= 10 && (
                <p className="text-xs text-blue-500 mt-1">{t('productFormPage.maxImagesReached')}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
                {existingImages.map((img, index) => (
                    <div key={img.id || img.image_url} className="relative">
                        <img src={img.image_url} alt="Existing" className="h-24 w-24 object-cover rounded border" />
                        <button
                            type="button"
                            onClick={() => removeImage(index, true)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title={t('productFormPage.removeImage')}
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
                            title={t('productFormPage.removeImage')}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            {((formData.imagesInput?.length || 0) + existingImages.length) < 3 && (
                <p className="text-xs text-red-500 mt-1">
                    {t('productFormPage.moreImagesRequired', { count: 3 - ((formData.imagesInput?.length || 0) + existingImages.length) })}
                </p>
            )}
        </div>

        <div>
            <label htmlFor="availability_status" className="block text-sm font-medium text-gray-700 mb-1">
              {t('productFormPage.availabilityStatusLabel')} <span className="text-red-500">*</span>
            </label>
            <select name="availability_status" id="availability_status" value={formData.availability_status || ''} onChange={handleChange} required className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                {Object.values(ProductAvailabilityStatus).filter(s => s !== ProductAvailabilityStatus.RENTED_OUT && s !== ProductAvailabilityStatus.PENDING_APPROVAL).map(status => (
                    <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                ))}
            </select>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} variant="primary" size="lg">
            {isEditMode ? t('productFormPage.saveChangesButton') : t('productFormPage.createButton')}
          </Button>
        </div>
      </form>
    </div>
  );
};
