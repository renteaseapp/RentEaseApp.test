import React from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { addDays as addDaysTz, getCurrentDate } from '../../utils/timezoneUtils';
import { Button } from '../../components/ui/Button';
import { EstimatedFees } from '../../services/settingsService';
import { Product } from '../../types';
import { RentalPickupMethod, UserAddress } from '../../types';
import { 
  RentalType,
  getRentalTypeInfo,
} from '../../utils/financialCalculations';
import {
  FaShoppingCart,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTag,
  FaCalendarAlt,
  FaInfoCircle,
  FaHandshake,
  FaTruck,
  FaCalculator,
} from 'react-icons/fa';

type Province = { id: number; name_th: string };

type OptimalRentalInfo = {
  type: RentalType;
  rate: number;
  savings: number;
};

type RentalRequestModalProps = {
  show: boolean;
  onClose: () => void;
  formError: string | null;
  setFormError: (value: string | null) => void;
  formSuccess: string | null;
  isSubmitting: boolean;
  handleRentalSubmit: (e: React.FormEvent) => Promise<void> | void;
  selectedRentalType: RentalType;
  setSelectedRentalType: (t: RentalType) => void;
  numberOfWeeks: number;
  setNumberOfWeeks: (n: number) => void;
  numberOfMonths: number;
  setNumberOfMonths: (n: number) => void;
  optimalRentalInfo: OptimalRentalInfo | null;
  subtotal: number;
  product: Product;
  startDateObj: Date | null;
  setStartDateObj: (d: Date | null) => void;
  endDateObj: Date | null;
  setEndDateObj: (d: Date | null) => void;
  dateAvailability: Record<string, boolean>;
  loadingDateAvailability: boolean;
  availabilityError: string | null;
  rentalDays: number;
  pickupMethod: RentalPickupMethod;
  setPickupMethod: (m: RentalPickupMethod) => void;
  isLoadingAddresses: boolean;
  addresses: UserAddress[];
  selectedAddressId?: number;
  setSelectedAddressId: (id: number | undefined) => void;
  provinces: Province[];
  notes: string;
  setNotes: (v: string) => void;
  estimatedFees: EstimatedFees | null;
  loadingFees: boolean;
  onAddAddress: () => void;
};

export const RentalRequestModal: React.FC<RentalRequestModalProps> = ({
  show,
  onClose,
  formError,
  setFormError,
  formSuccess,
  isSubmitting,
  handleRentalSubmit,
  selectedRentalType,
  setSelectedRentalType,
  numberOfWeeks,
  setNumberOfWeeks,
  numberOfMonths,
  setNumberOfMonths,
  optimalRentalInfo,
  subtotal,
  product,
  startDateObj,
  setStartDateObj,
  endDateObj,
  setEndDateObj,
  dateAvailability,
  loadingDateAvailability,
  availabilityError,
  rentalDays,
  pickupMethod,
  setPickupMethod,
  isLoadingAddresses,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  provinces,
  notes,
  setNotes,
  estimatedFees,
  loadingFees,
  onAddAddress,
}) => {
  if (!show) return null;

  // ตรวจสอบความพร้อมใช้งานทั้งช่วงวันที่ที่เลือก
  const allDatesAvailable = React.useMemo(() => {
    if (!startDateObj || !endDateObj) return false;
    const cur = new Date(startDateObj);
    while (cur <= endDateObj) {
      const dateStr = format(cur, 'yyyy-MM-dd');
      if (dateAvailability[dateStr] !== true) return false;
      cur.setDate(cur.getDate() + 1);
    }
    return true;
  }, [startDateObj, endDateObj, dateAvailability]);

  const unavailableDatesCount = React.useMemo(() => {
    if (!startDateObj || !endDateObj) return 0;
    let count = 0;
    const cur = new Date(startDateObj);
    while (cur <= endDateObj) {
      const dateStr = format(cur, 'yyyy-MM-dd');
      if (dateAvailability[dateStr] !== true) count += 1;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [startDateObj, endDateObj, dateAvailability]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        className="bg-white rounded-3xl shadow-2xl max-w-full sm:max-w-2xl w-full max-h-[95vh] overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl transition-colors duration-200 z-10" 
            onClick={onClose} 
            aria-label={'ปิด'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <FaShoppingCart className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">{'ส่งคำขอเช่าสินค้า'}</h2>
            </div>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">{'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งคำขอเช่าสินค้านี้'}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          {formError && (
            <motion.div 
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <FaExclamationTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{'เกิดข้อผิดพลาด'}</p>
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
              <button 
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}

          {formSuccess && (
            <motion.div 
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-green-800 font-medium">{'ส่งคำขอสำเร็จ'}</p>
                <p className="text-green-600 text-sm">{formSuccess}</p>
                <p className="text-green-500 text-xs mt-1">{'กำลังนำทางไปหน้าชำระเงิน...'}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleRentalSubmit} className="space-y-8">
            <motion.div 
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaTag className="w-5 h-5 text-purple-600" />
                    {'เลือกประเภทการเช่า'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{'เลือกว่าจะเช่าแบบรายวัน รายสัปดาห์ หรือรายเดือน'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaTag className="w-4 h-4 text-purple-600" />
                  {'เลือกประเภท'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRentalType(RentalType.DAILY)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedRentalType === RentalType.DAILY
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        selectedRentalType === RentalType.DAILY ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FaCalendarAlt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{'รายวัน'}</p>
                        <p className="text-xs text-gray-600">{'คิดราคาต่อวัน'}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold text-purple-600">฿{(product?.rental_price_per_day || 0).toLocaleString()}</span>
                      <span className="text-sm text-gray-600 ml-1">/วัน</span>
                    </div>
                  </button>
                  {product?.rental_price_per_week && (
                    <button
                      type="button"
                      onClick={() => setSelectedRentalType(RentalType.WEEKLY)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRentalType === RentalType.WEEKLY
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          selectedRentalType === RentalType.WEEKLY ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <FaCalendarAlt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{'รายสัปดาห์'}</p>
                          <p className="text-xs text-gray-600">{'เช่าระยะยาว 7 วันขึ้นไป'}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-bold text-purple-600">฿{product.rental_price_per_week.toLocaleString()}</span>
                        <span className="text-sm text-gray-600 ml-1">/สัปดาห์</span>
                        {rentalDays >= 7 && (
                          <div className="text-xs text-green-600 mt-1">
                            {'ประหยัด'} ฿{Math.max(0, (product.rental_price_per_day * 7) - product.rental_price_per_week).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                  {product?.rental_price_per_month && (
                    <button
                      type="button"
                      onClick={() => setSelectedRentalType(RentalType.MONTHLY)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRentalType === RentalType.MONTHLY
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          selectedRentalType === RentalType.MONTHLY ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <FaCalendarAlt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{'รายเดือน'}</p>
                          <p className="text-xs text-gray-600">{'เช่าระยะยาว 30 วันขึ้นไป'}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-bold text-purple-600">฿{product.rental_price_per_month.toLocaleString()}</span>
                        <span className="text-sm text-gray-600 ml-1">/เดือน</span>
                        {rentalDays >= 30 && (
                          <div className="text-xs text-green-600 mt-1">
                            {'ประหยัด'} ฿{Math.max(0, (product.rental_price_per_day * 30) - product.rental_price_per_month).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  )}
                </div>
                {optimalRentalInfo && optimalRentalInfo.savings > 0 && optimalRentalInfo.type !== selectedRentalType && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FaTag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {'แนะนำ! เลือก'} {getRentalTypeInfo(optimalRentalInfo.type).label} {'ประหยัดกว่า'} ฿{optimalRentalInfo.savings.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRentalType(optimalRentalInfo.type)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 transition-colors"
                      >
                        เลือก
                      </button>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {'ประเภทที่เลือก'}: {getRentalTypeInfo(selectedRentalType).label}
                      {rentalDays > 0 && (
                        <span className="ml-2">({rentalDays} {'วัน'} = ฿{subtotal.toLocaleString()})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedRentalType === RentalType.WEEKLY || selectedRentalType === RentalType.MONTHLY) && (
                <div className="mb-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaInfoCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">
                        {selectedRentalType === RentalType.WEEKLY ? 'เลือกจำนวนสัปดาห์' : 'เลือกจำนวนเดือน'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          {selectedRentalType === RentalType.WEEKLY ? 'จำนวนสัปดาห์' : 'จำนวนเดือน'}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedRentalType === RentalType.WEEKLY) {
                                setNumberOfWeeks(Math.max(1, numberOfWeeks - 1));
                              } else {
                                setNumberOfMonths(Math.max(1, numberOfMonths - 1));
                              }
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={selectedRentalType === RentalType.WEEKLY ? 52 : 12}
                            value={selectedRentalType === RentalType.WEEKLY ? numberOfWeeks : numberOfMonths}
                            onChange={(e) => {
                              const value = Math.max(1, parseInt(e.target.value || '1', 10));
                              if (selectedRentalType === RentalType.WEEKLY) {
                                setNumberOfWeeks(value);
                              } else {
                                setNumberOfMonths(value);
                              }
                            }}
                            className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedRentalType === RentalType.WEEKLY) {
                                setNumberOfWeeks(numberOfWeeks + 1);
                              } else {
                                setNumberOfMonths(numberOfMonths + 1);
                              }
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {startDateObj && (
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">วันสิ้นสุด (คำนวณอัตโนมัติ)</label>
                          <div className="p-3 bg-white rounded-xl border-2 border-green-200">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-700">
                                {(() => {
                                  if (selectedRentalType === RentalType.WEEKLY && numberOfWeeks > 0) {
                                    const endDate = new Date(startDateObj);
                                    endDate.setDate(endDate.getDate() + (numberOfWeeks * 7) - 1);
                                    return endDate.toLocaleDateString('th-TH');
                                  } else if (selectedRentalType === RentalType.MONTHLY && numberOfMonths > 0) {
                                    const endDate = new Date(startDateObj);
                                    endDate.setMonth(endDate.getMonth() + numberOfMonths);
                                    endDate.setDate(endDate.getDate() - 1);
                                    return endDate.toLocaleDateString('th-TH');
                                  }
                                  return 'กรุณาเลือกวันเริ่มต้นก่อน';
                                })()}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {selectedRentalType === RentalType.WEEKLY 
                                  ? `${numberOfWeeks} สัปดาห์ = ${numberOfWeeks * 7} วัน`
                                  : `${numberOfMonths} เดือน ≈ ${numberOfMonths * 30} วัน`
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-yellow-200">
                      <div className="text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">{'ประเภท'}:</span>
                          <span className="font-semibold text-blue-600">
                            {selectedRentalType === RentalType.WEEKLY ? `{'รายสัปดาห์'} (${numberOfWeeks} {'สัปดาห์'})` : `{'รายเดือน'} (${numberOfMonths} {'เดือน'})`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">{'ราคาต่อหน่วย'}:</span>
                          <span className="font-semibold">
                            ฿{selectedRentalType === RentalType.WEEKLY
                              ? (product?.rental_price_per_week || 0).toLocaleString()
                              : (product?.rental_price_per_month || 0).toLocaleString()
                            } / {selectedRentalType === RentalType.WEEKLY ? 'สัปดาห์' : 'เดือน'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                          <span className="text-gray-600">{'ค่าเช่ารวม'}:</span>
                          <span className="font-bold text-green-600">
                            ฿{selectedRentalType === RentalType.WEEKLY
                              ? ((product?.rental_price_per_week || 0) * numberOfWeeks).toLocaleString()
                              : ((product?.rental_price_per_month || 0) * numberOfMonths).toLocaleString()
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-yellow-600">
                      <strong>{'หมายเหตุ'}:</strong> {'ระบบจะคำนวณวันสิ้นสุดโดยอัตโนมัติ'}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">2</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaCalendarAlt className="w-5 h-5 text-blue-600" />
                    {'เลือกช่วงวันที่ต้องการเช่า'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{'เลือกวันเริ่มต้นและวันสิ้นสุดที่ต้องการเช่า'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{'วันเริ่มต้น'}<span className="text-red-500 ml-1">*</span></label>
                  <div className="relative">
                    <DatePicker
                      selected={startDateObj}
                      onChange={(date) => {
                        setStartDateObj(date);
                      }}
                      minDate={addDaysTz(getCurrentDate(), 1).toDate()}
                      placeholderText={
                        selectedRentalType === RentalType.WEEKLY 
                          ? 'เลือกวันเริ่มต้นสัปดาห์' 
                          : selectedRentalType === RentalType.MONTHLY 
                          ? 'เลือกวันเริ่มต้นเดือน' 
                          : 'เลือกวันที่'
                      }
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      showPopperArrow
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      isClearable
                      todayButton={'วันนี้'}
                      calendarStartDay={selectedRentalType === RentalType.WEEKLY ? 1 : undefined}
                      showWeekNumbers={selectedRentalType === RentalType.WEEKLY}
                      filterDate={(date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isAvailable = dateAvailability[dateStr];
                        // อนุญาตให้เลือกเมื่อสถานะยังไม่ทราบ (undefined) และบล็อกเฉพาะวันที่รู้แน่ชัดว่าเช่าไม่ได้ (false)
                        return isAvailable !== false;
                      }}
                      dayClassName={(date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isAvailable = dateAvailability[dateStr];
                        if (isAvailable === undefined) return 'text-gray-400';
                        return isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200 line-through';
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FaCalendarAlt className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{'วันสิ้นสุด'}<span className="text-red-500 ml-1">*</span></label>
                  <div className="relative">
                    <DatePicker
                      selected={endDateObj}
                      onChange={(date) => setEndDateObj(date)}
                      minDate={startDateObj ? addDaysTz(startDateObj, 1).toDate() : addDaysTz(getCurrentDate(), 2).toDate()}
                      disabled={!startDateObj || selectedRentalType !== RentalType.DAILY}
                      placeholderText={
                        selectedRentalType === RentalType.DAILY 
                          ? 'เลือกวันที่' 
                          : `คำนวณอัตโนมัติ (${selectedRentalType === RentalType.WEEKLY ? `${numberOfWeeks} สัปดาห์` : `${numberOfMonths} เดือน`})`
                      }
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                      showPopperArrow
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      isClearable={selectedRentalType === RentalType.DAILY}
                      todayButton={selectedRentalType === RentalType.DAILY ? 'วันนี้' : undefined}
                      readOnly={selectedRentalType !== RentalType.DAILY}
                      filterDate={(date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isAvailable = dateAvailability[dateStr];
                        // อนุญาตให้เลือกเมื่อสถานะยังไม่ทราบ (undefined) และบล็อกเฉพาะวันที่รู้แน่ชัดว่าเช่าไม่ได้ (false)
                        return isAvailable !== false;
                      }}
                      dayClassName={(date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isAvailable = dateAvailability[dateStr];
                        if (isAvailable === undefined) return 'text-gray-400';
                        return isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200 line-through';
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FaCalendarAlt className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaInfoCircle className="w-4 h-4" />
                  {'คำอธิบายสีในปฏิทิน'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                    <span className="text-green-700 font-medium">{'เช่าได้'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span className="text-red-700 font-medium">{'เช่าไม่ได้'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-gray-600 font-medium">{'กำลังตรวจสอบ'}</span>
                  </div>
                </div>
                {loadingDateAvailability && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                    {'กำลังตรวจสอบความพร้อมใช้งาน...'}
                  </div>
                )}
                {availabilityError && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3" />
                    {availabilityError}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">{'สินค้านี้รองรับการเช่าพร้อมกันตามจำนวนคงเหลือ'}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{'จำนวนคงเหลือที่พร้อมเช่า'}: {product?.quantity_available ?? product?.quantity ?? 0} {'ชิ้น'}</p>
                </div>
              </div>
              {startDateObj && endDateObj && endDateObj <= startDateObj && (
                <motion.div 
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FaExclamationTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{'วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น'}</span>
                </motion.div>
              )}
              {startDateObj && endDateObj && endDateObj >= startDateObj && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border ${
                    rentalDays >= (product?.min_rental_duration_days || 1) && (!product?.max_rental_duration_days || rentalDays <= product.max_rental_duration_days)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {rentalDays >= (product?.min_rental_duration_days || 1) && (!product?.max_rental_duration_days || rentalDays <= product.max_rental_duration_days) ? (
                      <>
                        <FaCheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">{'ระยะเวลาเช่าถูกต้อง'} ({rentalDays} {'วัน'})</span>
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          {rentalDays < (product?.min_rental_duration_days || 1) 
                            ? `ระยะเวลาเช่าสั้นเกินไป ต้องเช่าอย่างน้อย ${product?.min_rental_duration_days || 1} วัน`
                            : `ระยะเวลาเช่ายาวเกินไป ต้องเช่าไม่เกิน ${product?.max_rental_duration_days} วัน`}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              {startDateObj && endDateObj && endDateObj >= startDateObj && !loadingDateAvailability && !availabilityError && !allDatesAvailable && (
                <motion.div 
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm">{'ช่วงวันที่เลือกมีบางวันไม่พร้อมเช่า'} ({unavailableDatesCount} {'วัน'}) {'กรุณาเลือกช่วงอื่น'}</span>
                </motion.div>
              )}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm flex items-center gap-2">
                  <FaInfoCircle className="w-4 h-4 flex-shrink-0" />
                  {'วันเริ่มต้นคือวันแรกของการเช่า วันสิ้นสุดคือวันสุดท้ายของการเช่า'}
                </p>
              </div>
              {startDateObj && endDateObj && rentalDays > 0 && (
                <motion.div 
                  className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FaCalendarAlt className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-indigo-800">{'สรุปช่วงเวลาเช่า'}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <div className="text-xs text-gray-600 mb-1">{'ช่วงเวลา'}</div>
                      <div className="font-semibold text-gray-900">{startDateObj.toLocaleDateString('th-TH')} - {endDateObj.toLocaleDateString('th-TH')}</div>
                      <div className="text-xs text-gray-500 mt-1">{'รวม'} {rentalDays} {'วัน'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <div className="text-xs text-gray-600 mb-1">{'ประเภทการเช่า'}</div>
                      <div className="font-semibold text-indigo-800">{getRentalTypeInfo(selectedRentalType).label}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{'ค่าเช่ารวม'}:</span>
                      <span className="font-bold text-indigo-800">฿{subtotal.toLocaleString()}</span>
                    </div>
                    {optimalRentalInfo && optimalRentalInfo.savings > 0 && optimalRentalInfo.type === selectedRentalType && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-green-600">{'ประหยัด'}:</span>
                        <span className="font-semibold text-green-600">฿{optimalRentalInfo.savings.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">3</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaTruck className="w-5 h-5 text-green-600" />
                    {'วิธีรับสินค้า'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{'เลือกว่าคุณจะไปรับเอง หรือให้จัดส่ง'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPickupMethod(RentalPickupMethod.SELF_PICKUP)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    pickupMethod === RentalPickupMethod.SELF_PICKUP
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      pickupMethod === RentalPickupMethod.SELF_PICKUP ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <FaHandshake className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{'รับสินค้าด้วยตนเอง'}</p>
                      <p className="text-sm text-gray-600">{'ไปรับสินค้าจากเจ้าของโดยตรง'}</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPickupMethod(RentalPickupMethod.DELIVERY)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    pickupMethod === RentalPickupMethod.DELIVERY
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      pickupMethod === RentalPickupMethod.DELIVERY ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <FaTruck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{'จัดส่งสินค้า'}</p>
                      <p className="text-sm text-gray-600">{'จัดส่งถึงที่อยู่ของคุณ (มีค่าธรรมเนียม)'}</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>

            {pickupMethod === RentalPickupMethod.DELIVERY && (
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">4</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaCalendarAlt className="w-5 h-5 text-purple-600" />
                      {'ที่อยู่สำหรับจัดส่ง'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{'เลือกที่อยู่ที่ต้องการให้จัดส่งสินค้า'}</p>
                  </div>
                </div>
                {isLoadingAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-purple-600">{'กำลังโหลดที่อยู่...'}</span>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-4">
                    <select 
                      value={selectedAddressId || ''} 
                      onChange={(e) => setSelectedAddressId(Number(e.target.value))} 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                    >
                      <option value="">{'เลือกที่อยู่'}</option>
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.recipient_name} - {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          {addr.sub_district ? `, ${addr.sub_district}` : ''}, {addr.district}, {provinces.find((p) => p.id === addr.province_id)?.name_th || `จังหวัด ID: ${addr.province_id}`}
                          {addr.postal_code ? ` ${addr.postal_code}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCalendarAlt className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 mb-4">{'ไม่พบที่อยู่สำหรับจัดส่ง'}</p>
                    <Button 
                      type="button" 
                      variant="primary" 
                      className="px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
                      onClick={onAddAddress}
                    >
                      {'เพิ่มที่อยู่ใหม่'}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div 
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">5</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {'หมายเหตุเพิ่มเติม'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{'ระบุรายละเอียดเพิ่มเติมถึงเจ้าของสินค้า (ถ้ามี)'}</p>
                </div>
              </div>
              <textarea 
                name="notes" 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
                className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white resize-none" 
                placeholder={'เช่น เวลานัดรับสินค้าที่สะดวก, จุดสังเกตของสถานที่จัดส่ง'}
              />
            </motion.div>

            {rentalDays > 0 && (
              <motion.div 
                className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-bold text-sm">6</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaCalculator className="w-5 h-5 text-indigo-600" />
                      {'สรุปค่าใช้จ่าย'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{'สรุปยอดเงินที่คุณต้องชำระ (ยอดเงินสุดท้ายจะยืนยันในหน้าชำระเงิน)'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">{'ระยะเวลาเช่า'}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{rentalDays} {'วัน'}</span>
                    </div>
                    <div className="text-xs text-gray-600">{'ตั้งแต่วันที่'} {startDateObj?.toLocaleDateString('th-TH')} {'ถึง'} {endDateObj?.toLocaleDateString('th-TH')}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaTag className="w-4 h-4 text-indigo-600" />
                      {'รายการค่าเช่า'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{'ค่าเช่า'} ({getRentalTypeInfo(selectedRentalType).label})</span>
                          {optimalRentalInfo && optimalRentalInfo.savings > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{'ประหยัด'} ฿{optimalRentalInfo.savings.toLocaleString()}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">฿{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 pl-4">
                        {selectedRentalType === RentalType.DAILY ? (
                          `฿${(product?.rental_price_per_day || 0).toLocaleString()} × ${rentalDays} วัน`
                        ) : selectedRentalType === RentalType.WEEKLY ? (
                          `฿${(product?.rental_price_per_week || 0).toLocaleString()} × ${Math.ceil(rentalDays / 7)} สัปดาห์`
                        ) : (
                          `฿${(product?.rental_price_per_month || 0).toLocaleString()} × ${Math.ceil(rentalDays / 30)} เดือน`
                        )}
                      </div>
                    </div>
                  </div>
                  {product?.security_deposit && product.security_deposit > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{'เงินประกัน'}</span>
                          <span className="text-xs text-yellow-600">({'จะได้รับคืนเมื่อสิ้นสุดการเช่า'})</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">฿{product.security_deposit.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {loadingFees ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">{'กำลังคำนวณค่าธรรมเนียม...'}</span>
                      </div>
                    </div>
                  ) : estimatedFees ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FaCalculator className="w-4 h-4 text-blue-600" />
                        {'ค่าธรรมเนียมโดยประมาณ'}
                      </h4>
                      <div className="space-y-2">
                        {estimatedFees.platform_fee_renter > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{'ค่าธรรมเนียมแพลตฟอร์ม'}</span>
                            <span className="text-sm font-bold text-gray-900">฿{estimatedFees.platform_fee_renter.toLocaleString()}</span>
                          </div>
                        )}
                        {pickupMethod === RentalPickupMethod.DELIVERY && estimatedFees.delivery_fee > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{'ค่าจัดส่ง'}</span>
                            <span className="text-sm font-bold text-gray-900">฿{estimatedFees.delivery_fee.toLocaleString()}</span>
                          </div>
                        )}
                        {estimatedFees.total_estimated_fees > 0 && (
                          <div className="pt-2 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-blue-700">{'รวมค่าธรรมเนียม'}</span>
                              <span className="text-sm font-bold text-blue-900">฿{estimatedFees.total_estimated_fees.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        {estimatedFees.total_estimated_fees === 0 && (
                          <div className="text-center py-2">
                            <span className="text-sm text-green-600 font-medium">{'ไม่มีค่าธรรมเนียมเพิ่มเติม'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FaTruck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">{'ค่าธรรมเนียม'}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">{'ค่าธรรมเนียมจะถูกคำนวณอีกครั้งในหน้าชำระเงิน'}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl p-4 border-2 border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCalculator className="w-5 h-5 text-indigo-700" />
                        <span className="text-lg font-bold text-indigo-900">{'ยอดรวมเบื้องต้น'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-900">
                          ฿{(subtotal + (product?.security_deposit || 0) + (estimatedFees?.total_estimated_fees || 0)).toLocaleString()}
                        </div>
                        <div className="text-xs text-indigo-600">
                          {estimatedFees?.total_estimated_fees
                            ? 'รวมเงินประกันและค่าธรรมเนียมโดยประมาณ'
                            : product?.security_deposit
                            ? 'รวมเงินประกัน'
                            : 'ยังไม่รวมค่าธรรมเนียม'}
                        </div>
                      </div>
                    </div>
                    {estimatedFees && (
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <div className="text-xs text-indigo-700 space-y-1">
                          <div className="flex justify-between"><span>{'ค่าเช่า'}:</span><span>฿{subtotal.toLocaleString()}</span></div>
                          {product?.security_deposit && product.security_deposit > 0 && (
                            <div className="flex justify-between"><span>{'เงินประกัน'}:</span><span>฿{product.security_deposit.toLocaleString()}</span></div>
                          )}
                          {estimatedFees.total_estimated_fees > 0 && (
                            <div className="flex justify-between"><span>{'รวมค่าธรรมเนียม'}:</span><span>฿{estimatedFees.total_estimated_fees.toLocaleString()}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FaInfoCircle className="w-4 h-4 text-gray-600" />
                      {'ข้อควรทราบ'}
                    </h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• {'ค่าธรรมเนียมอ้างอิงจากการตั้งค่าระบบในปัจจุบัน'}</li>
                      <li>• {'ค่าธรรมเนียมแพลตฟอร์มสำหรับผู้เช่าในปัจจุบัน'} {estimatedFees ? `${((estimatedFees.platform_fee_renter / subtotal) * 100).toFixed(1)}%` : '0%'}</li>
                      {pickupMethod === RentalPickupMethod.DELIVERY && (
                        <li>• {'ค่าจัดส่งเริ่มต้น'} {estimatedFees ? `฿${estimatedFees.delivery_fee.toLocaleString()}` : 'กำลังโหลด'}</li>
                      )}
                      {product?.security_deposit && (
                        <li>• {'เงินประกันจะถูกคืนเมื่อสิ้นสุดการเช่าหากไม่มีความเสียหาย'}</li>
                      )}
                      <li>• {'ยอดเงินสุดท้ายจะยืนยันในหน้าชำระเงิน'}</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Button 
                type="submit" 
                isLoading={isSubmitting} 
                fullWidth 
                variant="primary" 
                size="lg" 
                disabled={
                  rentalDays <= 0 || 
                  isSubmitting || 
                  rentalDays < (product?.min_rental_duration_days || 1) ||
                  (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false) ||
                  loadingDateAvailability ||
                  !!availabilityError ||
                  (startDateObj && endDateObj && endDateObj >= startDateObj ? !allDatesAvailable : false) ||
                  (pickupMethod === RentalPickupMethod.DELIVERY ? (isLoadingAddresses || !selectedAddressId || addresses.length === 0) : false)
                }
                className={`font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                  rentalDays <= 0 || 
                  isSubmitting || 
                  rentalDays < (product?.min_rental_duration_days || 1) ||
                  (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false) ||
                  loadingDateAvailability ||
                  !!availabilityError ||
                  (startDateObj && endDateObj && endDateObj >= startDateObj ? !allDatesAvailable : false) ||
                  (pickupMethod === RentalPickupMethod.DELIVERY ? (isLoadingAddresses || !selectedAddressId || addresses.length === 0) : false)
                    ? 'bg-gray-400 cursor-not-allowed hover:scale-100'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaShoppingCart className="w-6 h-6" />
                  <span className="text-lg">
                    {loadingDateAvailability
                      ? 'กำลังตรวจสอบความพร้อมใช้งาน...'
                      : availabilityError
                      ? 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อมใช้งาน'
                      : rentalDays <= 0 
                      ? 'กรุณาเลือกวันที่'
                      : rentalDays < (product?.min_rental_duration_days || 1)
                      ? `ระยะเวลาเช่าสั้นเกินไป (ขั้นต่ำ ${product?.min_rental_duration_days || 1} วัน)`
                      : (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false)
                      ? `ระยะเวลาเช่ายาวเกินไป (สูงสุด ${product?.max_rental_duration_days} วัน)`
                      : (startDateObj && endDateObj && endDateObj >= startDateObj && !allDatesAvailable)
                      ? 'ช่วงวันที่มีบางวันเช่าไม่ได้'
                      : (pickupMethod === RentalPickupMethod.DELIVERY && (isLoadingAddresses || !selectedAddressId || addresses.length === 0))
                      ? 'กรุณาเลือกที่อยู่สำหรับจัดส่ง'
                      : 'ส่งคำขอเช่า'}
                  </span>
                </div>
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RentalRequestModal;


