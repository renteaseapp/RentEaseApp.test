import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import { motion } from 'framer-motion';

// Import icons for a richer UI
import {
  FaChartBar, FaChartPie, FaDollarSign, FaBox, FaClipboardList, FaStar,
  FaArrowLeft, FaMoneyBillWave, FaRankingStar
} from 'react-icons/fa6'; // Using Fa6 for newer icons like FaRankingStar

const API_URL = 'https://renteaseapi2.onrender.com/api/owners/me/report';
// Define a more consistent and appealing color palette for charts
const CHART_COLORS = [
  '#6366F1', // Indigo-500 (Primary Blue)
  '#22C55E', // Green-500
  '#F59E0B', // Amber-500
  '#EF4444', // Red-500
  '#8B5CF6', // Violet-500
  '#06B6D4', // Cyan-500
  '#EC4899', // Pink-500
  '#A8A29E', // Stone-500',
];

// Helper components for consistency (similar to OwnerRentalDetailPage)
const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
    <div className="flex-shrink-0 w-7 h-7 text-blue-600">{icon}</div>
    <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
  </div>
);

const MetricCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; description?: string; color?: string }> = ({ title, value, icon, description, color = 'text-blue-600' }) => (
  <Card className="shadow-xl border border-gray-100 rounded-2xl h-full flex flex-col justify-between">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2 leading-none">{value}</div>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </CardContent>
  </Card>
);


const OwnerReportPage: React.FC = () => {
  const { token } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchReport = useCallback(async () => {
    if (!token) {
      setError("คุณไม่ได้เข้าสู่ระบบ");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 401) {
        setError("เซสชันหมดอายุ โปรดเข้าสู่ระบบใหม่");
        // Optionally redirect to login or handle logout here
        // logout(); // Assuming a logout function from AuthContext
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ไม่สามารถดึงรายงานได้');
      }
      const result = await response.json();
      setReport(result.data.data);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError(err.message || "ไม่สามารถโหลดรายงานได้");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner message={"กำลังโหลดรายงาน..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="p-4 text-center text-gray-700">{"ไม่พบข้อมูลรายงาน"}</div>
      </div>
    );
  }

  // Data for charts (using direct Thai translations)
  const productStatusData = [
    { name: "สินค้าพร้อมให้เช่า", value: report.products_available },
    { name: "สินค้าถูกเช่าออกไป", value: report.products_rented_out },
  ].filter(item => item.value > 0); // Filter out zero values for cleaner charts

  const rentalStatusOverviewData = [
    { name: "เช่าเสร็จสมบูรณ์", value: report.completed_rentals },
    { name: "ยกเลิก", value: report.cancelled_rentals },
    { name: "การเช่าทั้งหมด", value: report.total_rentals },
  ].filter(item => item.value > 0);

  const revenueOverviewData = [
    { name: "รายได้รวมทั้งหมด", value: report.total_revenue },
    { name: "รายได้เดือนปัจจุบัน", value: report.revenue_this_month },
  ].filter(item => item.value > 0);


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
                <FaChartBar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{"รายงานและสถิติสำหรับเจ้าของ"}</h1>
              <p className="text-blue-100 text-lg">
                {"สรุปข้อมูลและประสิทธิภาพทางธุรกิจของคุณ"}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="primary" 
                className="bg-white text-black hover:bg-blue-50 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg"
                onClick={() => navigate(-1)} // Go back to previous page
              >
                <FaArrowLeft className="h-5 w-5 mr-2" />
                {"ย้อนกลับ"}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Products Metric Card */}
          <MetricCard
            title={"สินค้าทั้งหมด"}
            value={report.total_products}
            icon={<FaBox />}
            description={`พร้อมให้เช่า: ${report.products_available}, ถูกเช่า: ${report.products_rented_out}`}
            color="text-indigo-600"
          />
          {/* Total Rentals Metric Card */}
          <MetricCard
            title={"การเช่าทั้งหมด"}
            value={report.total_rentals}
            icon={<FaClipboardList />}
            description={`เสร็จสมบูรณ์: ${report.completed_rentals}, ยกเลิก: ${report.cancelled_rentals}`}
            color="text-green-600"
          />
          {/* Total Revenue Metric Card */}
          <MetricCard
            title={"รายได้รวมทั้งหมด"}
            value={`฿${report.total_revenue?.toLocaleString() || '0'}`}
            icon={<FaDollarSign />}
            description={`รายได้เดือนปัจจุบัน: ฿${report.revenue_this_month?.toLocaleString() || '0'}`}
            color="text-amber-600"
          />
          {/* Average Rating Metric Card */}
          <MetricCard
            title={"คะแนนเฉลี่ย"}
            value={<><FaStar className="inline-block align-text-bottom text-yellow-500 mr-1"/>{report.average_rating}</>}
            icon={<FaRankingStar />}
            description={`รีวิวทั้งหมด: ${report.total_reviews}`}
            color="text-blue-600"
          />

        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Product Status Chart */}
          <Card className="shadow-xl border border-gray-100 rounded-2xl">
            <CardContent className="p-6">
              <SectionTitle icon={<FaChartPie />} title={"สถานะสินค้า"} />
              {productStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ name, percent }) =>
                        percent !== undefined
                          ? `${name} (${(percent * 100).toFixed(0)}%)`
                          : name
                      }
                    >
                      {productStatusData.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "ชิ้น"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">{"ไม่พบข้อมูลสำหรับแผนภูมินี้"}</p>
              )}
            </CardContent>
          </Card>

          {/* Rental Status Chart */}
          <Card className="shadow-xl border border-gray-100 rounded-2xl">
            <CardContent className="p-6">
              <SectionTitle icon={<FaChartBar />} title={"ภาพรวมสถานะการเช่า"} />
              {rentalStatusOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rentalStatusOverviewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [value, "รายการเช่า"]} />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">{"ไม่พบข้อมูลสำหรับแผนภูมินี้"}</p>
              )}
            </CardContent>
          </Card>

          {/* Revenue Overview Chart */}
          <Card className="shadow-xl border border-gray-100 rounded-2xl lg:col-span-2">
            <CardContent className="p-6">
              <SectionTitle icon={<FaMoneyBillWave />} title={"ภาพรวมรายได้"} />
              {revenueOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueOverviewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value: number) => `฿${value.toLocaleString()}`} />
                    <Tooltip formatter={(value: number) => [`฿${value.toLocaleString()}`, "จำนวนเงิน"]} />
                    <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500">{"ไม่พบข้อมูลสำหรับแผนภูมินี้"}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tables Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 gap-6"
        >
          {/* Top Products Table */}
          <Card className="shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <SectionTitle icon={<FaRankingStar />} title={"สินค้าที่มีการเช่าสูงสุด (Top Products)"} />
              {report.top_products && report.top_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {"ชื่อสินค้า"}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {"จำนวนการเช่า"}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {"รายได้รวม"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.top_products.map((prod: any, idx: number) => (
                        <tr key={prod.product_id || idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prod.title || "ไม่มีชื่อ"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{prod.rental_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">฿{prod.total_revenue?.toLocaleString() || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">{"ยังไม่มีข้อมูลสินค้าที่มีการเช่าสูงสุด"}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerReportPage;