import React, { useEffect, useState } from 'react';
import { getRentalsReport, getIncomeReport, getPlatformStats, getUserReputationReport, getComplaintsReport, getProductsReport } from '../../services/adminReportsService';
import { Card, CardContent } from '../../components/ui/Card';

import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaSearch, 
  FaTimes, 
  FaDownload, 
  FaFilter,
  FaCalendarAlt,
  FaUsers,
  FaExclamationTriangle,
  FaBox,
  FaCheck,
  FaClock,
  FaTimes as FaX,
  FaStar,
  FaMoneyBillWave,
  FaChartLine,
  FaFileExport
} from 'react-icons/fa';
import dayjs from 'dayjs';
import { Button } from '../../components/ui/Button';

const StatCard = ({ icon, label, value, color, gradient }: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode; 
  color: string;
  gradient?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className={`${gradient || `bg-gradient-to-r from-${color}-500 to-${color}-600`} text-white shadow-xl border-0 overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-${color}-100 text-sm font-medium mb-1`}>{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-${color}-200/20`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const BarChart = ({ data, labels, height = 200 }: { data: number[]; labels: string[]; height?: number }) => {
  const max = Math.max(...data, 1);
  const barWidth = 50;
  const gap = 30;
  
  return (
    <div className="overflow-x-auto">
      <svg width={(barWidth + gap) * data.length} height={height} style={{ overflow: 'visible' }}>
        {data.map((v, i) => (
          <g key={i}>
            <defs>
              <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect
              x={i * (barWidth + gap)}
              y={height - (v / max) * (height - 40)}
              width={barWidth}
              height={(v / max) * (height - 40)}
              fill={`url(#gradient-${i})`}
              rx={8}
              className="transition-all duration-300 hover:opacity-80"
            />
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize={12}
              fill="#6b7280"
              fontWeight={500}
            >
              {labels[i]}
            </text>
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - (v / max) * (height - 40) - 10}
              textAnchor="middle"
              fontSize={14}
              fill="#1f2937"
              fontWeight={600}
            >
              {v}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Helper to export array of objects to CSV
function exportProductsToCSV(products: any[], filterType: string, productMonth: string, productStartDate: string, productEndDate: string) {
  if (!products || products.length === 0) return;
  let filterSummary = '';
  if (filterType === 'all') {
    filterSummary = 'แสดงข้อมูลทั้งหมด';
  } else if (filterType === 'month') {
    filterSummary = `แสดงข้อมูลสำหรับเดือน ${dayjs(productMonth + '-01').format('MMMM YYYY')}`;
  } else if (filterType === 'dateRange') {
    filterSummary = `แสดงข้อมูลตั้งแต่วันที่ ${dayjs(productStartDate).format('DD MMM YYYY')} ถึง ${dayjs(productEndDate).format('DD MMM YYYY')}`;
  }
  const headers = Object.keys(products[0]);
  const csvRows = [
    '"' + filterSummary + '"',
    headers.join(','),
    ...products.map(row => headers.map(h => '"' + String(row[h]).replace(/"/g, '""') + '"').join(','))
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_report_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const AdminReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store raw data for all years
  const [allRentalsByMonth, setAllRentalsByMonth] = useState<{ [month: string]: number }>({});
  const [allIncome, setAllIncome] = useState<number | null>(null);
  const [allPlatformStats, setAllPlatformStats] = useState<any>({});
  const [allComplaints, setAllComplaints] = useState<number | null>(null);
  const [allReputations, setAllReputations] = useState<any[]>([]);
  const [productsReport, setProductsReport] = useState<any>(null);
  const [productFilterType, setProductFilterType] = useState<'all' | 'month' | 'dateRange'>('all');
  const [productMonth, setProductMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [productStartDate, setProductStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [productEndDate, setProductEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const currentYear = dayjs().year();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRentalsReport(),
      getIncomeReport(),
      getPlatformStats(),
      getUserReputationReport(),
      getComplaintsReport(),
      getProductsReport()
    ])
      .then(([rentalsRes, incomeRes, statsRes, repRes, complaintsRes, productsRes]) => {
        setAllRentalsByMonth(rentalsRes?.rentals_by_month || {});
        setAllIncome(incomeRes?.income ?? null);
        setAllPlatformStats(statsRes || {});
        setAllReputations(Array.isArray(repRes?.reputations) ? repRes.reputations : []);
        setAllComplaints(complaintsRes?.complaints ?? null);
        setProductsReport(productsRes || null);
      })
      .catch((err: any) => setError(err.message || 'ไม่สามารถโหลดข้อมูลได้'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch products report when filter changes
  useEffect(() => {
    let params: any = {};
    if (productFilterType === 'month') params.month = productMonth;
    else if (productFilterType === 'dateRange') {
      params.start_date = productStartDate;
      params.end_date = productEndDate;
    }
    getProductsReport(productFilterType === 'all' ? undefined : params).then(setProductsReport);
  }, [productFilterType, productMonth, productStartDate, productEndDate]);

  // Filter helpers
  const filterByYear = (obj: { [month: string]: number }) => {
    if (selectedYear === 'all') return obj;
    return Object.fromEntries(
      Object.entries(obj).filter(([month]) => month.startsWith(selectedYear.toString()))
    );
  };
  
  // Rentals by month chart data
  const rentalsByMonth = filterByYear(allRentalsByMonth);
  const rentalMonths = Object.keys(rentalsByMonth).sort();
  const rentalCounts = rentalMonths.map(m => rentalsByMonth[m]);
  const rentalLabels = rentalMonths.map(m => m.slice(0, 7)); // YYYY-MM

  // Stat cards: filter for selected year or all
  const statRentalsThisMonth = (() => {
    if (selectedYear === 'all') {
      // Show sum of last month in all years
      const months = Object.keys(allRentalsByMonth).sort();
      return months.length > 0 ? allRentalsByMonth[months[months.length - 1]] : '-';
    } else {
      // Show last month in selected year
      const months = Object.keys(rentalsByMonth).sort();
      return months.length > 0 ? rentalsByMonth[months[months.length - 1]] : '-';
    }
  })();

  // For income, platformStats, complaints, reputations: filter by year if possible
  const income = allIncome;
  const platformStats = allPlatformStats;
  const complaints = allComplaints;
  const reputations = allReputations;

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaChartBar className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium text-gray-700">กำลังโหลดรายงาน...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-700">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                  <FaChartBar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    รายงานและสถิติ
                  </h1>
                  <p className="text-gray-600 mt-1">
                    สถิติและข้อมูลเชิงลึกของแพลตฟอร์ม
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="year-select" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FaCalendarAlt className="h-4 w-4" />
                  กรองตามปี:
                </label>
                <select
                  id="year-select"
                  className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">ทุกปี</option>
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y === currentYear ? `ปีนี้ (${y})` : y}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            <StatCard
              icon={<FaChartLine className="h-6 w-6" />}
              label="การเช่าในเดือนนี้"
              value={statRentalsThisMonth}
              color="indigo"
            />
            <StatCard
              icon={<FaMoneyBillWave className="h-6 w-6" />}
              label="รายได้รวม"
              value={income !== null ? `฿${income.toLocaleString()}` : '-'}
              color="green"
            />
            <StatCard
              icon={<FaUsers className="h-6 w-6" />}
              label="ผู้ใช้"
              value={platformStats?.users?.toLocaleString() ?? '-'}
              color="blue"
            />
            <StatCard
              icon={<FaExclamationTriangle className="h-6 w-6" />}
              label="เรื่องร้องเรียน"
              value={complaints?.toLocaleString() ?? '-'}
              color="red"
            />
          </motion.div>

          {/* Bar Chart Rentals by Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-10"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                    <FaChartBar className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">การเช่าตามเดือน</h2>
                </div>
                <div className="overflow-x-auto">
                  <BarChart data={rentalCounts} labels={rentalLabels} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Reputation Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-10"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600">
                    <FaStar className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">ชื่อเสียงของผู้ใช้</h2>
                </div>
                {/* Mobile Card List */}
                <div className="block md:hidden">
                  {reputations.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <div className="flex flex-col items-center">
                        <FaStar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reputations.map((r: any, index) => {
                        let badgeColor = 'bg-green-100 text-green-800 border-green-200';
                        if (r.avg_rating < 3) badgeColor = 'bg-red-100 text-red-700 border-red-200';
                        else if (r.avg_rating < 4) badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        
                        return (
                          <motion.div
                            key={r.owner_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{r.owner_name || `เจ้าของ ${r.owner_id}`}</p>
                                <p className="text-sm text-gray-600 mt-1">{r.owner_email || '-'}</p>
                              </div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${badgeColor}`}>
                                <FaStar className="h-3 w-3 mr-1" />
                                {r.avg_rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="mt-3 flex gap-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
                                รีวิว {r.review_count}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold bg-purple-100 text-purple-700 border-purple-200">
                                สินค้า {r.product_count}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          ชื่อเจ้าของ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          อีเมล
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          คะแนน
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          รีวิว
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          สินค้า
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {reputations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-gray-400 py-12">
                            <div className="flex flex-col items-center">
                              <FaStar className="h-12 w-12 text-gray-300 mb-4" />
                              <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        reputations.map((r: any, index) => {
                          let badgeColor = 'bg-green-100 text-green-800 border-green-200';
                          if (r.avg_rating < 3) badgeColor = 'bg-red-100 text-red-700 border-red-200';
                          else if (r.avg_rating < 4) badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                          
                          return (
                            <motion.tr
                              key={r.owner_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-all duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {r.owner_name || `เจ้าของ ${r.owner_id}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {r.owner_email || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${badgeColor}`}>
                                  <FaStar className="h-3 w-3 mr-1" />
                                  {r.avg_rating.toFixed(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
                                  {r.review_count}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold bg-purple-100 text-purple-700 border-purple-200">
                                  {r.product_count}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-10"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                    <FaBox className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">สินค้า</h2>
                </div>

                {/* Filter Controls */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-center">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaFilter className="h-4 w-4" />
                      กรองตาม:
                    </label>
                    <select
                      className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white w-full sm:w-auto"
                      value={productFilterType}
                      onChange={e => setProductFilterType(e.target.value as any)}
                    >
                      <option value="all">ทุกปี</option>
                      <option value="month">เดือน</option>
                      <option value="dateRange">ช่วงวันที่</option>
                    </select>
                    
                    {productFilterType === 'month' && (
                      <input
                        type="month"
                        className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white w-full sm:w-auto"
                        value={productMonth}
                        onChange={e => setProductMonth(e.target.value)}
                      />
                    )}
                    
                    {productFilterType === 'dateRange' && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <input
                          type="date"
                          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white w-full sm:w-auto"
                          value={productStartDate}
                          onChange={e => setProductStartDate(e.target.value)}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="date"
                          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white w-full sm:w-auto"
                          value={productEndDate}
                          onChange={e => setProductEndDate(e.target.value)}
                        />
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProductFilterType('all');
                        setProductsReport(null);
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <FaTimes className="h-4 w-4" />
                      ล้างตัวกรอง
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => exportProductsToCSV(
                        productsReport?.top_rented_products || [],
                        productFilterType,
                        productMonth,
                        productStartDate,
                        productEndDate
                      )}
                      disabled={!productsReport || !productsReport.top_rented_products || productsReport.top_rented_products.length === 0}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <FaFileExport className="h-4 w-4" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </div>

                {/* Show filter summary */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    {productFilterType === 'all' && (
                      <span>แสดงข้อมูลทั้งหมด</span>
                    )}
                    {productFilterType === 'month' && (
                      <span>
                        แสดงข้อมูลสำหรับเดือน {dayjs(productMonth + '-01').format('MMMM YYYY')}
                      </span>
                    )}
                    {productFilterType === 'dateRange' && (
                      <span>
                        แสดงข้อมูลตั้งแต่วันที่ {dayjs(productStartDate).format('DD MMM YYYY')} ถึง {dayjs(productEndDate).format('DD MMM YYYY')}
                      </span>
                    )}
                  </p>
                </div>

                {productsReport && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard 
                        icon={<FaBox className="h-6 w-6" />} 
                        label="สินค้าทั้งหมด" 
                        value={productsReport.total_products?.toLocaleString()} 
                        color="indigo" 
                      />
                      <StatCard 
                        icon={<FaCheck className="h-6 w-6" />} 
                        label="อนุมัติแล้ว" 
                        value={productsReport.status_counts?.approved?.toLocaleString() ?? '0'} 
                        color="green" 
                      />
                      <StatCard 
                        icon={<FaClock className="h-6 w-6" />} 
                        label="รอการตรวจสอบ" 
                        value={productsReport.status_counts?.pending?.toLocaleString() ?? '0'} 
                        color="yellow" 
                      />
                      <StatCard 
                        icon={<FaX className="h-6 w-6" />} 
                        label="ถูกปฏิเสธ" 
                        value={productsReport.status_counts?.rejected?.toLocaleString() ?? '0'} 
                        color="red" 
                      />
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <FaChartBar className="h-5 w-5 text-indigo-500" />
                        สินค้ายอดนิยม
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                สินค้า
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                จำนวนการเช่า
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                รายได้
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {productsReport.top_rented_products?.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center text-gray-400 py-12">
                                  <div className="flex flex-col items-center">
                                    <FaBox className="h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-lg font-medium">ไม่พบสินค้า</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              productsReport.top_rented_products?.map((p: any, index: number) => (
                                <motion.tr
                                  key={p.product_id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="hover:bg-gray-50 transition-all duration-200"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {p.title}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                                      {p.rental_count}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                                    ฿{p.income?.toLocaleString()}
                                  </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};
