import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

const featureIcons: Record<string, React.ReactNode> = {
  'User Management': <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  'Product Management': <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" /></svg>,
  'Category Management': <svg className="h-7 w-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  'Complaints System': <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414A7 7 0 1116.95 7.05l1.414-1.414z" /></svg>,
  'System Settings': <svg className="h-7 w-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  'Reports & Analytics': <svg className="h-7 w-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>,
};

const AdminFeatureCard: React.FC<{ title: string; description: string; linkTo: string }> = ({ title, description, linkTo }) => (
    <Link to={linkTo} className="block group">
        <Card className="transition-shadow duration-200 group-hover:shadow-2xl border border-blue-50">
            <CardContent>
                <div className="flex items-center gap-4 mb-2">
                  {featureIcons[title]}
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{title}</h3>
                </div>
                <p className="text-sm text-gray-500">{description}</p>
            </CardContent>
        </Card>
    </Link>
);

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 text-lg">Manage all aspects of the platform from one place</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AdminFeatureCard title="User Management" description="View, edit, and manage user accounts." linkTo={ROUTE_PATHS.ADMIN_MANAGE_USERS} />
        <AdminFeatureCard title="Product Management" description="Approve, edit, or remove product listings." linkTo={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS} />
        {/* <AdminFeatureCard title="Rental Management" description="Oversee rental transactions and statuses." linkTo={ROUTE_PATHS.ADMIN_MANAGE_RENTALS} /> */}
        <AdminFeatureCard title="Category Management" description="Add, edit, or remove product categories." linkTo={ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES} />
        {/* <AdminFeatureCard title="Claims Management" description="Review and mediate user claims." linkTo={ROUTE_PATHS.ADMIN_MANAGE_CLAIMS} /> */}
        <AdminFeatureCard title="Complaints System" description="Address and resolve user complaints." linkTo={ROUTE_PATHS.ADMIN_MANAGE_COMPLAINTS} />
        {/* <AdminFeatureCard title="Static Content (CMS)" description="Manage pages like About Us, FAQ, Terms." linkTo={ROUTE_PATHS.ADMIN_MANAGE_STATIC_CONTENT} /> */}
        <AdminFeatureCard title="System Settings" description="Configure platform-wide settings." linkTo={ROUTE_PATHS.ADMIN_SYSTEM_SETTINGS} />
        <AdminFeatureCard title="Reports & Analytics" description="View platform usage statistics and reports." linkTo={ROUTE_PATHS.ADMIN_REPORTS} />
      </div>
      <div className="mt-12 p-6 bg-white rounded-xl shadow border border-blue-50">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v5H7a2 2 0 00-2 2v5a2 2 0 002 2z" /></svg>
          Platform Overview
        </h2>
        <p className="text-gray-500">Detailed statistics and charts will be displayed here. (Coming Soon)</p>
      </div>
    </div>
  );
};
