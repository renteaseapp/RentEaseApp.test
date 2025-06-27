import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { getRentalsReport, getIncomeReport, getPlatformStats, getComplaintsReport, getUserReputationReport } from '../../services/adminReportsService';

export const AdminReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentals, setRentals] = useState<any>(null);
  const [income, setIncome] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<any>(null);
  const [reputation, setReputation] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRentalsReport(),
      getIncomeReport(),
      getPlatformStats(),
      getComplaintsReport(),
      getUserReputationReport()
    ]).then(([rentals, income, stats, complaints, reputation]) => {
      setRentals(rentals);
      setIncome(income);
      setStats(stats);
      setComplaints(complaints);
      setReputation(reputation);
    }).catch((err: any) => setError(err.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Reports & Analytics</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card><CardContent>
          <h2 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> Rentals This Month</h2>
          <div className="text-2xl font-bold">{rentals?.rentals ?? '-'}</div>
          <div className="text-gray-500 text-sm">Month: {rentals?.month}</div>
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Owner Income</h2>
          <div className="text-2xl font-bold text-green-700">฿{income?.income ?? '-'}</div>
          <div className="text-gray-500 text-sm">Owner ID: {income?.owner_id}</div>
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> Platform Stats</h2>
          <div>Users: {stats?.users ?? '-'}</div>
          <div>Rentals: {stats?.rentals ?? '-'}</div>
        </CardContent></Card>
        <Card><CardContent>
          <h2 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg> Complaints</h2>
          <div className="text-2xl font-bold text-red-700">{complaints?.complaints ?? '-'}</div>
        </CardContent></Card>
      </div>
      <Card className="border border-indigo-100 shadow-xl">
        <CardContent>
          <h2 className="text-xl font-bold mb-2 text-indigo-700 flex items-center gap-2"><svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg> User Reputation</h2>
          <table className="min-w-full text-sm">
            <thead><tr><th>User ID</th><th>Score</th></tr></thead>
            <tbody>
              {reputation?.reputations?.map((r: any) => (
                <tr key={r.user_id}><td>{r.user_id}</td><td>{r.score}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
