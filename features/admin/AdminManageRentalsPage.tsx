import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { adminGetRentals } from '../../services/adminService';
import { Rental, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { Button } from '../../components/ui/Button';

export const AdminManageRentalsPage: React.FC = () => {
  // ไม่มี API /api/admin/rentals ตาม spec
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Rentals</h1>
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
        <b>Not implemented:</b> ไม่มี API /api/admin/rentals ตาม spec ที่กำหนด
      </div>
    </div>
  );
};
