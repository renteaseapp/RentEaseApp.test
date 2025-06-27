import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerDashboardData } from '../../services/ownerService';
import { getOwnerRentals, approveRentalRequest, rejectRentalRequest } from '../../services/rentalService';
import { OwnerDashboardData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <CardContent>
            <div className="flex items-center">
                {icon && <div className="mr-4 text-blue-500">{icon}</div>}
                <div>
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

const dashboardMenu = [
  {
    title: 'สินค้าของฉัน',
    description: 'จัดการสินค้า เพิ่ม/แก้ไข/ลบ',
    to: ROUTE_PATHS.MY_LISTINGS,
    icon: <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M4 11h16" /></svg>
  },
  {
    title: 'การเช่าทั้งหมด',
    description: 'ดูและจัดการรายการเช่าทั้งหมด',
    to: ROUTE_PATHS.OWNER_RENTAL_HISTORY,
    icon: <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-6a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
  },
  {
    title: 'แจ้งคืน/รับคืนสินค้า',
    description: 'จัดการการคืนสินค้าแต่ละรายการ',
    to: ROUTE_PATHS.OWNER_RENTAL_HISTORY,
    icon: <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4a2 2 0 01-2 2H7a2 2 0 01-2-2V7m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m14 0H5" /></svg>
  },
  {
    title: 'วิธีการรับเงิน',
    description: 'ตั้งค่าช่องทางรับเงินจากการเช่า',
    to: ROUTE_PATHS.PAYOUT_INFO,
    icon: <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 8v8m8-8a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
  },
  {
    title: 'รายงาน/สถิติ',
    description: 'ดูสถิติและรายงานภาพรวม',
    to: ROUTE_PATHS.OWNER_DASHBOARD, // หรือ ROUTE_PATHS.ADMIN_REPORTS ถ้ามี
    icon: <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17a4 4 0 01-4-4V5a4 4 0 018 0v8a4 4 0 01-4 4zm0 0v4m0 0h2m-2 0H9" /></svg>
  },
  {
    title: 'ตั้งค่าบัญชี',
    description: 'แก้ไขข้อมูลส่วนตัวและยืนยันตัวตน',
    to: ROUTE_PATHS.PROFILE,
    icon: <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
];

export const OwnerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRentalId, setRejectingRentalId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<{[id:number]:boolean}>({});
  const { showSuccess, showError } = useAlert();

  // For active menu highlighting
  const currentPath = window.location.pathname;

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

    const fetchPendingRequests = async () => {
      setIsLoadingPending(true);
      try {
        const res = await getOwnerRentals({ status: 'pending_owner_approval', limit: 5 });
        setPendingRequests(res.data || []);
      } catch (e) {
        setPendingRequests([]);
      } finally {
        setIsLoadingPending(false);
      }
    };

    fetchDashboardData();
    fetchPendingRequests();
  }, [user, navigate, t]);

  // Quick Action Handlers
  const handleApprove = async (rentalId: number) => {
    setActionLoading((prev) => ({ ...prev, [rentalId]: true }));
    try {
      await approveRentalRequest(rentalId);
      showSuccess(t('ownerDashboardPage.quickActions.approveSuccess'));
      setPendingRequests((prev) => prev.filter((r) => r.id !== rentalId));
    } catch (e) {
      showError(t('ownerDashboardPage.quickActions.approveError'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [rentalId]: false }));
    }
  };
  const handleReject = (rentalId: number) => {
    setRejectingRentalId(rentalId);
    setRejectDialogOpen(true);
  };
  const confirmReject = async () => {
    if (!rejectingRentalId) return;
    setActionLoading((prev) => ({ ...prev, [rejectingRentalId]: true }));
    try {
      await rejectRentalRequest(rejectingRentalId, rejectReason);
      showSuccess(t('ownerDashboardPage.quickActions.rejectSuccess'));
      setPendingRequests((prev) => prev.filter((r) => r.id !== rejectingRentalId));
    } catch (e) {
      showError(t('ownerDashboardPage.quickActions.rejectError'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [rejectingRentalId!]: false }));
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectingRentalId(null);
    }
  };
  const handleChat = (rental: any) => {
    navigate(`/chat/${rental.renter?.id}`);
  };

  if (isLoading) return <LoadingSpinner message={t('navbar.loading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return <div className="p-4">{t('ownerDashboardPage.noData')}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">แดชบอร์ดเจ้าของสินค้า</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardMenu.map((item, idx) => (
          <Link to={item.to} key={idx} className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6 group border border-gray-100 hover:border-blue-400">
            <div className="flex items-center gap-4 mb-3">
              {item.icon}
              <span className="text-xl font-semibold text-gray-700 group-hover:text-blue-600">{item.title}</span>
            </div>
            <div className="text-gray-500 text-sm">{item.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
