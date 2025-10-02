import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaClock, 
  FaCreditCard, 
  FaBox, 
  FaShippingFast, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaHourglassHalf,
  FaFileAlt,
  FaBan,
  FaCheck
} from 'react-icons/fa';

export interface RentalStatusStepperProps {
  rentalStatus: string;
  paymentStatus: string;
  userType: 'owner' | 'renter';
  className?: string;
}

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'pending' | 'failed' | 'cancelled';
}

const RentalStatusStepper: React.FC<RentalStatusStepperProps> = ({
  rentalStatus,
  paymentStatus,
  userType,
  className = ''
}) => {
  
  // กำหนดขั้นตอนการเช่าตาม userType
  const getRentalSteps = (): StepConfig[] => {
    const baseSteps: StepConfig[] = [
      {
        id: 'request',
        title: userType === 'owner' ? 'รับคำขอเช่า' : 'ส่งคำขอเช่า',
        description: userType === 'owner' ? 'มีคำขอเช่าเข้ามา' : 'ส่งคำขอเช่าแล้ว',
        icon: FaFileAlt,
        status: 'completed'
      },
      {
        id: 'approval',
        title: userType === 'owner' ? 'อนุมัติคำขอ' : 'รอการอนุมัติ',
        description: userType === 'owner' ? 'พิจารณาอนุมัติคำขอ' : 'รอเจ้าของอนุมัติ',
        icon: FaClock,
        status: 'pending'
      },
      {
        id: 'payment',
        title: 'ชำระเงิน',
        description: userType === 'owner' ? 'รอผู้เช่าชำระเงิน' : 'ชำระเงินค่าเช่า',
        icon: FaCreditCard,
        status: 'pending'
      },
      {
        id: 'confirmed',
        title: 'ยืนยันการเช่า',
        description: 'การเช่าได้รับการยืนยัน',
        icon: FaCheckCircle,
        status: 'pending'
      },
      {
        id: 'active',
        title: 'กำลังใช้งาน',
        description: 'สินค้าอยู่ในระหว่างการเช่า',
        icon: FaBox,
        status: 'pending'
      },
      {
        id: 'return',
        title: 'คืนสินค้า',
        description: userType === 'owner' ? 'รับคืนสินค้า' : 'ส่งคืนสินค้า',
        icon: FaShippingFast,
        status: 'pending'
      },
      {
        id: 'completed',
        title: 'เสร็จสิ้น',
        description: 'การเช่าเสร็จสมบูรณ์',
        icon: FaCheck,
        status: 'pending'
      }
    ];

    // อัปเดตสถานะตาม rentalStatus
    return baseSteps.map(step => {
      let status: StepConfig['status'] = 'pending';
      
      switch (rentalStatus) {
        case 'draft':
          if (step.id === 'request') status = 'current';
          break;
        case 'pending_owner_approval':
          if (step.id === 'request') status = 'completed';
          if (step.id === 'approval') status = 'current';
          break;
        case 'rejected_by_owner':
          if (step.id === 'request') status = 'completed';
          if (step.id === 'approval') status = 'failed';
          break;
        case 'pending_payment':
          if (['request', 'approval'].includes(step.id)) status = 'completed';
          if (step.id === 'payment') status = 'current';
          break;
        case 'confirmed':
          if (['request', 'approval', 'payment'].includes(step.id)) status = 'completed';
          if (step.id === 'confirmed') status = 'current';
          break;
        case 'active':
          if (['request', 'approval', 'payment', 'confirmed'].includes(step.id)) status = 'completed';
          if (step.id === 'active') status = 'current';
          break;
        case 'return_pending':
          if (['request', 'approval', 'payment', 'confirmed', 'active'].includes(step.id)) status = 'completed';
          if (step.id === 'return') status = 'current';
          break;
        case 'completed':
          if (['request', 'approval', 'payment', 'confirmed', 'active', 'return'].includes(step.id)) status = 'completed';
          if (step.id === 'completed') status = 'completed';
          break;
        case 'cancelled_by_renter':
        case 'cancelled_by_owner':
        case 'expired':
          // แสดงสถานะที่ผ่านมาแล้วเป็น completed และหยุดที่จุดยกเลิก
          if (step.id === 'request') status = 'completed';
          if (rentalStatus === 'cancelled_by_renter' || rentalStatus === 'cancelled_by_owner') {
            if (step.id === 'approval' && ['pending_owner_approval', 'pending_payment', 'confirmed', 'active'].includes(rentalStatus)) {
              status = 'cancelled';
            }
          }
          break;
        case 'late_return':
          if (['request', 'approval', 'payment', 'confirmed', 'active'].includes(step.id)) status = 'completed';
          if (step.id === 'return') status = 'failed';
          break;
      }
      
      return { ...step, status };
    });
  };

  // กำหนดขั้นตอนการชำระเงิน
  const getPaymentSteps = (): StepConfig[] => {
    const steps: StepConfig[] = [
      {
        id: 'pending',
        title: 'รอชำระเงิน',
        description: userType === 'owner' ? 'รอผู้เช่าชำระเงิน' : 'ชำระเงินค่าเช่า',
        icon: FaClock,
        status: 'pending'
      },
      {
        id: 'verification',
        title: 'ตรวจสอบการชำระ',
        description: userType === 'owner' ? 'ตรวจสอบสลิปการโอน' : 'รอตรวจสอบการชำระ',
        icon: FaHourglassHalf,
        status: 'pending'
      },
      {
        id: 'confirmed',
        title: 'ยืนยันการชำระ',
        description: 'การชำระเงินสำเร็จ',
        icon: FaCheckCircle,
        status: 'pending'
      }
    ];

    return steps.map(step => {
      let status: StepConfig['status'] = 'pending';
      
      switch (paymentStatus) {
        case 'unpaid':
        case 'pending':
          if (step.id === 'pending') status = 'current';
          break;
        case 'pending_verification':
          if (step.id === 'pending') status = 'completed';
          if (step.id === 'verification') status = 'current';
          break;
        case 'paid':
          if (['pending', 'verification'].includes(step.id)) status = 'completed';
          if (step.id === 'confirmed') status = 'completed';
          break;
        case 'failed':
          if (step.id === 'pending') status = 'completed';
          if (step.id === 'verification') status = 'failed';
          break;
        case 'refunded':
          if (['pending', 'verification', 'confirmed'].includes(step.id)) status = 'completed';
          break;
      }
      
      return { ...step, status };
    });
  };

  const getStepColor = (status: StepConfig['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'current':
        return 'bg-blue-500 border-blue-500 text-white animate-pulse';
      case 'failed':
        return 'bg-red-500 border-red-500 text-white';
      case 'cancelled':
        return 'bg-gray-500 border-gray-500 text-white';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500';
    }
  };

  const getConnectorColor = (currentStatus: StepConfig['status'], nextStatus: StepConfig['status']) => {
    if (currentStatus === 'completed') {
      return 'bg-green-500';
    }
    if (currentStatus === 'failed' || currentStatus === 'cancelled') {
      return 'bg-red-500';
    }
    return 'bg-gray-300';
  };

  const StepItem: React.FC<{ step: StepConfig; stepNumber: number; isLast: boolean }> = ({ 
    step, 
    stepNumber, 
    isLast 
  }) => {
    const IconComponent = step.icon;
    
    return (
      <div className="flex items-center">
        <div className="flex flex-col items-center">
          {/* Step Circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: stepNumber * 0.1 }}
            className={`
              relative w-12 h-12 rounded-full border-2 flex items-center justify-center
              ${getStepColor(step.status)}
              shadow-lg transition-all duration-300
            `}
          >
            <IconComponent className="w-5 h-5" />
            {step.status === 'current' && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping" />
            )}
          </motion.div>
          
          {/* Step Info */}
          <div className="mt-3 text-center max-w-24">
            <h4 className="text-sm font-semibold text-gray-800 leading-tight">
              {step.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-tight">
              {step.description}
            </p>
          </div>
        </div>
        
        {/* Connector Line */}
        {!isLast && (
          <div className="flex-1 mx-4">
            <div 
              className={`h-1 rounded-full transition-all duration-500 ${
                step.status === 'completed' ? 'bg-green-500' : 
                step.status === 'failed' || step.status === 'cancelled' ? 'bg-red-500' : 
                'bg-gray-300'
              }`}
            />
          </div>
        )}
      </div>
    );
  };

  const rentalSteps = getRentalSteps();
  const paymentSteps = getPaymentSteps();

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Rental Status Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaBox className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">สถานะการเช่า</h3>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex items-center min-w-max pb-4">
            {rentalSteps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                stepNumber={index}
                isLast={index === rentalSteps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status Section */}
      {(rentalStatus === 'pending_payment' || rentalStatus === 'confirmed' || rentalStatus === 'active' || paymentStatus !== 'unpaid') && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCreditCard className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">สถานะการชำระเงิน</h3>
          </div>
          
          <div className="overflow-x-auto">
            <div className="flex items-center min-w-max pb-4">
              {paymentSteps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  stepNumber={index}
                  isLast={index === paymentSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">สถานะปัจจุบัน:</span>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-800">
              การเช่า: {getRentalStatusText(rentalStatus)}
            </span>
            {paymentStatus !== 'unpaid' && (
              <span className="font-medium text-gray-800">
                การชำระ: {getPaymentStatusText(paymentStatus)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for status text
const getRentalStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'ร่างคำขอ',
    'pending_owner_approval': 'รอการอนุมัติ',
    'rejected_by_owner': 'ถูกปฏิเสธ',
    'pending_payment': 'รอชำระเงิน',
    'confirmed': 'ยืนยันแล้ว',
    'active': 'กำลังใช้งาน',
    'return_pending': 'รอคืนสินค้า',
    'completed': 'เสร็จสิ้น',
    'cancelled_by_renter': 'ยกเลิกโดยผู้เช่า',
    'cancelled_by_owner': 'ยกเลิกโดยเจ้าของ',
    'expired': 'หมดอายุ',
    'late_return': 'คืนล่าช้า',
    'dispute': 'มีข้อพิพาท'
  };
  return statusMap[status] || status;
};

const getPaymentStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'unpaid': 'ยังไม่ชำระ',
    'pending': 'รอดำเนินการ',
    'pending_verification': 'รอตรวจสอบ',
    'paid': 'ชำระแล้ว',
    'failed': 'ชำระไม่สำเร็จ',
    'refunded': 'คืนเงินแล้ว'
  };
  return statusMap[status] || status;
};

export default RentalStatusStepper;
export { RentalStatusStepper };