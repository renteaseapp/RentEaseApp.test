import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerDashboardData } from '../../services/ownerService';
import { OwnerDashboardData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBox,
  FaClipboardList,
  FaUndo,
  FaMoneyBillWave,
  FaChartBar,
  FaUserCog,
  FaClock,
  FaArrowRight,
  FaShieldAlt,
  FaShoppingCart,
} from 'react-icons/fa';

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    whileTap={{ scale: 0.95 }}
    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden group"
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 truncate mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const dashboardMenu = [
  {
    title: 'สินค้าของฉัน',
    description: 'จัดการสินค้า เพิ่ม/แก้ไข/ลบ',
    to: ROUTE_PATHS.MY_LISTINGS,
    icon: <FaBox className="w-7 h-7" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'การเช่าทั้งหมด',
    description: 'ดูและจัดการรายการเช่าทั้งหมด',
    to: ROUTE_PATHS.OWNER_RENTAL_HISTORY,
    icon: <FaClipboardList className="w-7 h-7" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'รับคืนสินค้า',
    description: 'จัดการการคืนสินค้าแต่ละรายการ',
    to: ROUTE_PATHS.OWNER_RENTAL_HISTORY + '?returnOnly=1',
    icon: <FaUndo className="w-7 h-7" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'วิธีการรับเงิน',
    description: 'ตั้งค่าช่องทางรับเงินจากการเช่า',
    to: ROUTE_PATHS.PAYOUT_INFO,
    icon: <FaMoneyBillWave className="w-7 h-7" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'รายงาน/สถิติ',
    description: 'ดูสถิติและรายงานภาพรวม',
    to: ROUTE_PATHS.OWNER_REPORT,
    icon: <FaChartBar className="w-7 h-7" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'ตั้งค่าบัญชี',
    description: 'แก้ไขข้อมูลส่วนตัวและยืนยันตัวตน',
    to: ROUTE_PATHS.PROFILE,
    icon: <FaUserCog className="w-7 h-7" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    gradient: 'from-gray-500 to-gray-600'
  },
];

export const OwnerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For active menu highlighting

  useEffect(() => {
    if (!user?.id) {
      navigate(ROUTE_PATHS.LOGIN);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await getOwnerDashboardData(user.id);
        console.log('Dashboard response:', response);
        if (response.success && response.data) {
          console.log('Dashboard data:', response.data);
          setDashboardData(response.data);
        } else {
          console.log('Dashboard error:', response.message);
          setError(response.message || t('general.error'));
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        if (errorMessage === 'Authentication failed') {
          navigate(ROUTE_PATHS.LOGIN);
        } else {
          setError(errorMessage || t('general.error'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, t]);



  if (isLoading) return <LoadingSpinner message={t('navbar.loading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return <div className="p-4">{t('ownerDashboardPage.noData')}</div>;

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
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <FaShieldAlt className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">แดชบอร์ดเจ้าของสินค้า</h1>
            <p className="text-blue-100 text-xl max-w-2xl mx-auto">
              จัดการสินค้า การเช่า และดูสถิติการใช้งานของคุณ
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ภาพรวมการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="สินค้าทั้งหมด"
              value={dashboardData.total_my_products || 0}
              icon={<FaBox className="w-6 h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="การเช่าที่ยังไม่เสร็จสิ้น"
              value={dashboardData.active_rentals_count || 0}
              icon={<FaShoppingCart className="w-6 h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="รายได้ต่อเดือน (ประมาณ)"
              value={`฿${(dashboardData.estimated_monthly_revenue || 0).toLocaleString()}`}
              icon={<FaMoneyBillWave className="w-6 h-6 text-white" />}
              color="bg-yellow-500"
            />
            <StatCard
              title="คำขอเช่าที่รอการอนุมัติ"
              value={dashboardData.pending_rental_requests_count || 0}
              icon={<FaClock className="w-6 h-6 text-white" />}
              color="bg-purple-500"
            />
          </div>
        </motion.div>



        {/* Menu Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">เมนูการจัดการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {dashboardMenu.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Link to={item.to} className="block">
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 p-8 h-full group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-indigo-50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-4 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <div className={item.color}>
                            {item.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <motion.div
                            className={`h-1 bg-gradient-to-r ${item.gradient} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                        <FaArrowRight className={`h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 ml-2`} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>


      </div>


    </div>
  );
};
