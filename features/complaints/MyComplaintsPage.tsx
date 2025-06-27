
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getComplaintsForUser } from '../../services/complaintService';
import { Complaint, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

export const MyComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [complaintsResponse, setComplaintsResponse] = useState<PaginatedResponse<Complaint> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      getComplaintsForUser(user.id, {}) // Add pagination/filter params if needed
        .then(setComplaintsResponse)
        .catch(err => setError((err as ApiError).message || "Failed to load complaints history."))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <LoadingSpinner message="Loading your complaints..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Submitted Complaints</h1>
        <Link to={ROUTE_PATHS.SUBMIT_COMPLAINT}>
            <Button variant="primary">Submit New Complaint</Button>
        </Link>
      </div>
      
      {complaintsResponse && complaintsResponse.data.length > 0 ? (
        <div className="space-y-4">
          {complaintsResponse.data.map(complaint => (
            <Card key={complaint.id}>
              <CardContent>
                <h2 className="text-lg font-semibold text-gray-800">{complaint.title}</h2>
                <p className="text-sm text-gray-600">Status: <span className="font-medium">{complaint.status.replace(/_/g, ' ').toUpperCase()}</span></p>
                <p className="text-sm text-gray-600">Type: {complaint.complaint_type.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-sm text-gray-500">Submitted: {new Date(complaint.created_at).toLocaleDateString()}</p>
                {/* <div className="mt-3">
                  <Button variant="outline" size="sm">View Details</Button> 
                </div> */}
              </CardContent>
            </Card>
          ))}
          {/* TODO: Pagination */}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints found.</h3>
            <p className="text-gray-500">You have not submitted any complaints yet.</p>
        </div>
      )}
    </div>
  );
};
