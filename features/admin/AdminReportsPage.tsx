import React, { useEffect, useState } from 'react';
import { getRentalsReport, getIncomeReport, getPlatformStats, getUserReputationReport, getComplaintsReport, getProductsReport } from '../../services/adminReportsService';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) => (
  <Card className={`flex-1 min-w-[180px] shadow-md border-0`}>
    <CardContent className="flex items-center gap-4 py-4">
      <div className={`rounded-full p-2 bg-${color}-50 text-${color}-600`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
        <div className={`text-xl font-bold text-${color}-700`}>{value}</div>
      </div>
    </CardContent>
  </Card>
);

const BarChart = ({ data, labels, height = 180 }: { data: number[]; labels: string[]; height?: number }) => {
  const max = Math.max(...data, 1);
  const barWidth = 40;
  const gap = 24;
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
            rx={6}
          />
          <text
            x={i * (barWidth + gap) + barWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize={13}
            fill="#555"
          >
            {labels[i]}
          </text>
          <text
            x={i * (barWidth + gap) + barWidth / 2}
            y={height - (v / max) * (height - 30) - 8}
            textAnchor="middle"
            fontSize={13}
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

// Helper to export array of objects to CSV
function exportProductsToCSV(products: any[], filterType: string, productMonth: string, productStartDate: string, productEndDate: string, t: any) {
  if (!products || products.length === 0) return;
  let filterSummary = '';
  if (filterType === 'all') {
    filterSummary = t('showingAllData');
  } else if (filterType === 'month') {
    filterSummary = t('showingDataForMonth', { month: dayjs(productMonth + '-01').format('MMMM YYYY') });
  } else if (filterType === 'dateRange') {
    filterSummary = t('showingDataForRange', {
      start: dayjs(productStartDate).format('DD MMM YYYY'),
      end: dayjs(productEndDate).format('DD MMM YYYY')
    });
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
  const { t } = useTranslation('adminReportsPage');
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
      .catch((err: any) => setError(err.message || t('error.loadFailed')))
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
  // (Assume API returns all data, or only current year. If only current year, fallback to all)
  const income = allIncome; // If API returns per year, need to filter here
  const platformStats = allPlatformStats; // If API returns per year, need to filter here
  const complaints = allComplaints; // If API returns per year, need to filter here
  const reputations = allReputations; // If API returns per year, need to filter here

  if (loading) return <div className="p-8 text-center">{t('loadingReports')}</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t('title')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-600">{t('filterByYear')}:</label>
          <select
            id="year-select"
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">{t('allYears')}</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y === currentYear ? t('thisYear') + ` (${y})` : y}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>}
          label={t('rentalsThisMonth')}
          value={statRentalsThisMonth}
          color="indigo"
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label={t('totalIncome')}
          value={income !== null ? `฿${income}` : '-'}
          color="green"
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>}
          label={t('users')}
          value={platformStats?.users ?? '-'}
          color="blue"
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>}
          label={t('complaints')}
          value={complaints ?? '-'}
          color="red"
        />
      </div>
      {/* Bar Chart Rentals by Month */}
      <Card className="mb-10 border border-indigo-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> {t('rentalsByMonth')}</h2>
          <div className="overflow-x-auto">
            <BarChart data={rentalCounts} labels={rentalLabels} />
          </div>
        </CardContent>
      </Card>
      {/* User Reputation Table */}
      <Card className="border border-indigo-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> {t('userReputation')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-lg">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('ownerId') || 'Owner ID'}</th>
                  <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('score') || 'Score'}</th>
                  <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('reviewCount') || 'Reviews'}</th>
                </tr>
              </thead>
              <tbody>
                {reputations.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-6">{t('noResults') || '-'}</td></tr>
                ) : reputations.map((r: any) => {
                  let badgeColor = 'bg-green-100 text-green-800 border-green-200';
                  if (r.avg_rating < 3) badgeColor = 'bg-red-100 text-red-700 border-red-200';
                  else if (r.avg_rating < 4) badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  return (
                    <tr key={r.owner_id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{r.owner_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${badgeColor}`}>{r.avg_rating}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-full border text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">{r.review_count}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Product Stats Section */}
      <Card className="mb-10 border border-indigo-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>
            {t('products')}
          </h2>
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label className="text-sm font-medium text-gray-600">{t('filterBy')}:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={productFilterType}
              onChange={e => setProductFilterType(e.target.value as any)}
            >
              <option value="all">{t('allYears')}</option>
              <option value="month">{t('month')}</option>
              <option value="dateRange">{t('dateRange')}</option>
            </select>
            {productFilterType === 'month' && (
              <input
                type="month"
                className="border rounded px-2 py-1 text-sm"
                value={productMonth}
                onChange={e => setProductMonth(e.target.value)}
              />
            )}
            {productFilterType === 'dateRange' && (
              <>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={productStartDate}
                  onChange={e => setProductStartDate(e.target.value)}
                />
                <span>-</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={productEndDate}
                  onChange={e => setProductEndDate(e.target.value)}
                />
              </>
            )}
            <button
              type="button"
              className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium border border-gray-300"
              onClick={() => {
                setProductFilterType('all');
                setProductsReport(null);
              }}
            >
              {t('clearFilter')}
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium border border-blue-700"
              onClick={() => exportProductsToCSV(
                productsReport?.top_rented_products || [],
                productFilterType,
                productMonth,
                productStartDate,
                productEndDate,
                t
              )}
              disabled={!productsReport || !productsReport.top_rented_products || productsReport.top_rented_products.length === 0}
            >
              {t('exportCSV')}
            </button>
          </div>
          {/* Show filter summary */}
          <div className="mb-2 text-sm text-gray-600">
            {productFilterType === 'all' && (
              <span>{t('showingAllData')}</span>
            )}
            {productFilterType === 'month' && (
              <span>
                {t('showingDataForMonth', { month: dayjs(productMonth + '-01').format('MMMM YYYY') })}
              </span>
            )}
            {productFilterType === 'dateRange' && (
              <span>
                {t('showingDataForRange', {
                  start: dayjs(productStartDate).format('DD MMM YYYY'),
                  end: dayjs(productEndDate).format('DD MMM YYYY')
                })}
              </span>
            )}
          </div>
          {productsReport && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>} label={t('totalProducts')} value={productsReport.total_products} color="indigo" />
                <StatCard icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} label={t('approved')} value={productsReport.status_counts?.approved ?? 0} color="green" />
                <StatCard icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>} label={t('pending')} value={productsReport.status_counts?.pending ?? 0} color="yellow" />
                <StatCard icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>} label={t('rejected')} value={productsReport.status_counts?.rejected ?? 0} color="red" />
              </div>
              <h3 className="text-lg font-semibold mb-2 mt-4">{t('topRentedProducts')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('product')}</th>
                      <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('rentalCount')}</th>
                      <th className="px-4 py-2 text-left font-bold text-indigo-700 uppercase tracking-wider">{t('productIncome')}</th>
                    </tr>
                  </thead>
            <tbody>
                    {productsReport.top_rented_products?.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-gray-400 py-6">-</td></tr>
                    ) : productsReport.top_rented_products?.map((p: any) => (
                      <tr key={p.product_id} className="hover:bg-indigo-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{p.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.rental_count}</td>
                        <td className="px-4 py-3 whitespace-nowrap">฿{p.income}</td>
                      </tr>
              ))}
            </tbody>
          </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
