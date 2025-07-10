import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { getPlatformStats, getProductsReport, getRentalsReport, getIncomeReport, getComplaintsReport } from '../../services/adminReportsService';
import { AdminLayout } from '../../components/common/Navbar';

const featureIcons: Record<string, React.ReactNode> = {
  'User Management': <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  'Product Management': <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg>,
  'Category Management': <svg className="h-7 w-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  'Complaints System': <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>,
  'System Settings': <svg className="h-7 w-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  'Reports & Analytics': <svg className="h-7 w-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>,
};

const AdminFeatureCard = ({ title, description, linkTo }: { title: string; description: string; linkTo: string; }) => {
  const { t } = useTranslation('adminDashboardPage');
  return (
    <Link to={linkTo} className="block group">
      <Card className="transition-shadow duration-200 group-hover:shadow-2xl border border-blue-50">
        <CardContent>
          <div className="flex items-center gap-4 mb-2">
            {featureIcons[title]}
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{t(`features.${title}.title`)}</h3>
          </div>
          <p className="text-sm text-gray-500">{t(`features.${title}.description`)}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

// Simple BarChart for overview
const OverviewBarChart = ({ data, labels, height = 120 }: { data: number[]; labels: string[]; height?: number }) => {
  const max = Math.max(...data, 1);
  const barWidth = 28;
  const gap = 16;
  return (
    <svg width={(barWidth + gap) * data.length} height={height} style={{ overflow: 'visible' }}>
      {data.map((v, i) => (
        <g key={i}>
          <rect
            x={i * (barWidth + gap)}
            y={height - (v / max) * (height - 30)}
            width={barWidth}
            height={(v / max) * (height - 30)}
            fill="#6366f1"
            rx={4}
          />
          <text
            x={i * (barWidth + gap) + barWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize={11}
            fill="#555"
          >
            {labels[i]}
          </text>
          <text
            x={i * (barWidth + gap) + barWidth / 2}
            y={height - (v / max) * (height - 30) - 6}
            textAnchor="middle"
            fontSize={11}
            fill="#222"
            fontWeight={600}
          >
            {v}
          </text>
        </g>
      ))}
    </svg>
  );
};

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

  if (loading) return <div className="mt-12 p-6 bg-white rounded-xl shadow border border-blue-50 text-center">{t('loadingOverview')}</div>;
  if (error) return <div className="mt-12 p-6 bg-white rounded-xl shadow border border-blue-50 text-center text-red-500">{error}</div>;

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">{t('title')}</h1>
          <p className="text-gray-500 text-lg">{t('subtitle')}</p>
        </div>
        {/* Platform Overview Section */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow border border-blue-50">
          <h2 className="text-2xl font-bold text-gray-700 mb-1 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
            {t('overviewTitle')}
          </h2>
          <p className="text-gray-500 mb-6">{t('overviewSubtitle')}</p>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow border-0"><CardContent><div className="text-xs text-gray-500 mb-1">{t('totalUsers')}</div><div className="text-2xl font-bold text-blue-700">{stats.users ?? '-'}</div></CardContent></Card>
            <Card className="shadow border-0"><CardContent><div className="text-xs text-gray-500 mb-1">{t('totalProducts')}</div><div className="text-2xl font-bold text-indigo-700">{products.total_products ?? '-'}</div></CardContent></Card>
            <Card className="shadow border-0"><CardContent><div className="text-xs text-gray-500 mb-1">{t('totalRentals')}</div><div className="text-2xl font-bold text-purple-700">{stats.rentals ?? '-'}</div></CardContent></Card>
            <Card className="shadow border-0"><CardContent><div className="text-xs text-gray-500 mb-1">{t('totalIncome')}</div><div className="text-2xl font-bold text-green-700">{income.income !== undefined ? `฿${income.income.toLocaleString()}` : '-'}</div></CardContent></Card>
            <Card className="shadow border-0"><CardContent><div className="text-xs text-gray-500 mb-1">{t('complaints')}</div><div className="text-2xl font-bold text-red-700">{complaints.complaints ?? '-'}</div></CardContent></Card>
          </div>
          {/* Rentals Over Time Chart */}
          <div className="mb-2">
            <h3 className="text-lg font-semibold mb-2">{t('rentalsOverTime')}</h3>
            <div className="overflow-x-auto">
              <OverviewBarChart data={rentalCounts} labels={rentalLabels} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
