import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Typography, Grid, Box, Table, TableBody, TableContainer, TableCell, TableHead, TableRow, Paper } from '@mui/material';

const API_URL = '/api/owners/me/report';
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const OwnerReportPage: React.FC = () => {
  const { token } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) {
        setError('กรุณาเข้าสู่ระบบ');
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
          setError('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          setIsLoading(false);
          return;
        }
        const result = await response.json();
        setReport(result.data.data);
      } catch (err: any) {
        setError('เกิดข้อผิดพลาดในการโหลดรายงาน');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (isLoading) return <LoadingSpinner message="กำลังโหลดรายงาน..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!report) return <div className="p-4">ไม่พบข้อมูลรายงาน</div>;

  // Data for charts
  const productStatusData = [
    { name: 'พร้อมให้เช่า', value: report.products_available },
    { name: 'ถูกเช่าอยู่', value: report.products_rented_out },
  ];
  const rentalStatusData = [
    { name: 'เสร็จสิ้น', value: report.completed_rentals },
    { name: 'ถูกยกเลิก', value: report.cancelled_rentals },
    { name: 'ทั้งหมด', value: report.total_rentals },
  ];
  const revenueData = [
    { name: 'รายได้รวม', value: report.total_revenue },
    { name: 'รายได้เดือนนี้', value: report.revenue_this_month },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={3}>
        รายงานของคุณ
      </Typography>
      <Grid container spacing={3}>
        {/* สรุปจำนวนสินค้าและการเช่า */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">จำนวนสินค้า</Typography>
              <Typography variant="h3" fontWeight={700}>{report.total_products}</Typography>
              <Box mt={1} mb={1}>
                <Typography color="text.secondary" fontSize={14}>พร้อมให้เช่า: {report.products_available}</Typography>
                <Typography color="text.secondary" fontSize={14}>ถูกเช่าอยู่: {report.products_rented_out}</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={productStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                    {productStatusData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">การเช่า</Typography>
              <Typography variant="h3" fontWeight={700}>{report.total_rentals}</Typography>
              <Box mt={1} mb={1}>
                <Typography color="text.secondary" fontSize={14}>เสร็จสิ้น: {report.completed_rentals}</Typography>
                <Typography color="text.secondary" fontSize={14}>ถูกยกเลิก: {report.cancelled_rentals}</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={rentalStatusData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">รายได้</Typography>
              <Typography variant="h3" fontWeight={700}>{report.total_revenue} บาท</Typography>
              <Box mt={1} mb={1}>
                <Typography color="text.secondary" fontSize={14}>รายได้เดือนนี้: {report.revenue_this_month} บาท</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        {/* คะแนนรีวิวและร้องเรียน */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">คะแนนรีวิวเฉลี่ย</Typography>
              <Typography variant="h2" fontWeight={700} color="#FFD700">★ {report.average_rating}</Typography>
              <Typography color="text.secondary">จำนวนรีวิว: {report.total_reviews}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* รายการจ่ายเงินล่าสุด */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" mb={2}>รายการจ่ายเงินล่าสุด</Typography>
              {report.recent_payouts && report.recent_payouts.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>จำนวนเงิน</TableCell>
                        <TableCell>สถานะ</TableCell>
                        <TableCell>เวลาทำรายการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.recent_payouts.map((p: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{p.amount}</TableCell>
                          <TableCell>{p.status}</TableCell>
                          <TableCell>{p.transaction_time ? new Date(p.transaction_time).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">ไม่มีข้อมูลการจ่ายเงินล่าสุด</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* Top Products Section */}
        <Box mt={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" mb={2}>สินค้ายอดนิยม</Typography>
              {report.top_products && report.top_products.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ชื่อสินค้า</TableCell>
                        <TableCell align="right">จำนวนครั้งที่ถูกเช่า</TableCell>
                        <TableCell align="right">รายได้รวม (บาท)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.top_products.map((prod: any, idx: number) => (
                        <TableRow key={prod.product_id || idx}>
                          <TableCell>{prod.title}</TableCell>
                          <TableCell align="right">{prod.rental_count}</TableCell>
                          <TableCell align="right">{prod.total_revenue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">ไม่มีข้อมูลสินค้ายอดนิยม</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Grid>
      <Box mt={4}>
        <Button variant="outline" onClick={() => window.history.back()}>ย้อนกลับ</Button>
      </Box>
    </Box>
  );
};

export default OwnerReportPage; 