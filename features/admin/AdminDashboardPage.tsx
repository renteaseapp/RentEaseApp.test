import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getPlatformStats, getProductsReport, getRentalsReport, getIncomeReport, getComplaintsReport } from '../../services/adminReportsService';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaBox, 
  FaTags, 
  FaExclamationTriangle, 
  FaCog, 
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaDollarSign,
  FaShieldAlt,
  FaRocket,
  FaChartLine,
  FaHistory,
} from 'react-icons/fa';

const featureIcons: Record<string, React.ReactNode> = {
  'User Management': <FaUsers className="h-7 w-7 text-blue-500" />,
  'Product Management': <FaBox className="h-7 w-7 text-green-500" />,
  'Category Management': <FaTags className="h-7 w-7 text-yellow-500" />,
  'Complaints System': <FaExclamationTriangle className="h-7 w-7 text-red-500" />,
  'System Settings': <FaCog className="h-7 w-7 text-gray-500" />,
  'Reports & Analytics': <FaChartBar className="h-7 w-7 text-indigo-500" />,
  'Admin Logs': <FaHistory className="h-7 w-7 text-purple-500" />,
};

const AdminFeatureCard = ({ title, linkTo }: { title: string; description: string; linkTo: string; }) => {
  const { t } = useTranslation('adminDashboardPage');
  return (
    <Link to={linkTo} className="block group">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="transition-all duration-300 group-hover:shadow-2xl border border-blue-50 bg-white/80 backdrop-blur-sm hover:bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                {featureIcons[title]}
              </div>
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                {t(`features.${title}.title`)}
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t(`features.${title}.description`)}
            </p>
            <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
              <span className="text-sm font-medium">{t('accessFeature')}</span>
              <FaArrowUp className="ml-2 h-3 w-3 transform rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

// Enhanced BarChart for overview
const OverviewBarChart = ({ data, labels, height = 120 }: { data: number[]; labels: string[]; height?: number }) => {
  const max = Math.max(...data, 1);
  const barWidth = 32;
  const gap = 20;
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
      <svg width={(barWidth + gap) * data.length} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="1" />
          </linearGradient>
        </defs>
        {data.map((v, i) => (
          <g key={i}>
            <rect
              x={i * (barWidth + gap)}
              y={height - (v / max) * (height - 40)}
              width={barWidth}
              height={(v / max) * (height - 40)}
              fill="url(#barGradient)"
              rx={6}
              className="transition-all duration-300 hover:opacity-80"
            />
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={12}
              fill="#6b7280"
              fontWeight="500"
            >
              {labels[i]}
            </text>
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - (v / max) * (height - 40) - 8}
              textAnchor="middle"
              fontSize={12}
              fill="#1f2937"
              fontWeight="600"
            >
              {v}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
  trend?: { value: number; isPositive: boolean; } 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -5 }}
  >
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? <FaArrowUp className="h-3 w-3 mr-1" /> : <FaArrowDown className="h-3 w-3 mr-1" />}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </CardContent>
    </Card>
  </motion.div>
);

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation('adminDashboardPage');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<any>({});
  const [products, setProducts] = React.useState<any>({});
  const [rentals, setRentals] = React.useState<any>({});
  const [income, setIncome] = React.useState<any>({});
  const [complaints, setComplaints] = React.useState<any>({});

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      getPlatformStats(),
      getProductsReport(),
      getRentalsReport(),
      getIncomeReport(),
      getComplaintsReport()
    ])
      .then(([statsRes, productsRes, rentalsRes, incomeRes, complaintsRes]) => {
        setStats(statsRes || {});
        setProducts(productsRes || {});
        setRentals(rentalsRes || {});
        setIncome(incomeRes || {});
        setComplaints(complaintsRes || {});
      })
      .catch((err: any) => setError(err.message || t('loadingOverview')))
      .finally(() => setLoading(false));
  }, [t]);

  // Rentals Over Time chart data
  const rentalsByMonth = rentals.rentals_by_month || {};
  const rentalMonths = Object.keys(rentalsByMonth).sort();
  const rentalCounts = rentalMonths.map(m => rentalsByMonth[m]);
  const rentalLabels = rentalMonths.map(m => dayjs(m).format('MMM'));

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t('loadingOverview')}</p>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-2xl shadow-lg"
          >
            <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Platform Overview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                  <FaChartBar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t('overviewTitle')}
                  </h2>
                  <p className="text-gray-600">{t('overviewSubtitle')}</p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                  title={t('totalUsers')}
                  value={stats.users ?? '-'}
                  icon={<FaUsers className="h-6 w-6 text-white" />}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                  title={t('totalProducts')}
                  value={products.total_products ?? '-'}
                  icon={<FaBox className="h-6 w-6 text-white" />}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                  trend={{ value: 8, isPositive: true }}
                />
                <StatCard
                  title={t('totalRentals')}
                  value={stats.rentals ?? '-'}
                  icon={<FaCalendarAlt className="h-6 w-6 text-white" />}
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                  trend={{ value: 15, isPositive: true }}
                />
                <StatCard
                  title={t('totalIncome')}
                  value={income.income !== undefined ? `฿${income.income.toLocaleString()}` : '-'}
                  icon={<FaDollarSign className="h-6 w-6 text-white" />}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  trend={{ value: 23, isPositive: true }}
                />
                <StatCard
                  title={t('complaints')}
                  value={complaints.complaints ?? '-'}
                  icon={<FaExclamationTriangle className="h-6 w-6 text-white" />}
                  color="bg-gradient-to-br from-red-500 to-red-600"
                  trend={{ value: 5, isPositive: false }}
                />
              </div>

              {/* Rentals Over Time Chart */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <FaChartLine className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-800">{t('rentalsOverTime')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <OverviewBarChart data={rentalCounts} labels={rentalLabels} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Admin Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <FaShieldAlt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t('adminFeatures')}
                  </h2>
                  <p className="text-gray-600">{t('adminFeaturesSubtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminFeatureCard
                  title="User Management"
                  description="Manage user accounts, permissions, and profiles"
                  linkTo={ROUTE_PATHS.ADMIN_MANAGE_USERS}
                />
                <AdminFeatureCard
                  title="Product Management"
                  description="Oversee product listings, categories, and approvals"
                  linkTo={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS}
                />
                <AdminFeatureCard
                  title="Category Management"
                  description="Organize and manage product categories"
                  linkTo={ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES}
                />

                <AdminFeatureCard
                  title="System Settings"
                  description="Configure platform settings and preferences"
                  linkTo={ROUTE_PATHS.ADMIN_SETTINGS}
                />
                <AdminFeatureCard
                  title="Reports & Analytics"
                  description="View detailed reports and analytics data"
                  linkTo={ROUTE_PATHS.ADMIN_REPORTS}
                />
                <AdminFeatureCard
                  title="Admin Logs"
                  description="View admin action history and audit trail"
                  linkTo={ROUTE_PATHS.ADMIN_LOGS}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaRocket className="h-6 w-6" />
              <h2 className="text-2xl font-bold">{t('quickActions')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to={ROUTE_PATHS.ADMIN_MANAGE_USERS}
                className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300"
              >
                <FaUsers className="h-5 w-5" />
                <span className="font-medium">{t('viewUsers')}</span>
              </Link>

              <Link
                to={ROUTE_PATHS.ADMIN_REPORTS}
                className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300"
              >
                <FaChartBar className="h-5 w-5" />
                <span className="font-medium">{t('viewReports')}</span>
              </Link>

              <Link
                to={ROUTE_PATHS.ADMIN_LOGS}
                className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300"
              >
                <FaHistory className="h-5 w-5" />
                <span className="font-medium">ดูประวัติ Admin</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};
