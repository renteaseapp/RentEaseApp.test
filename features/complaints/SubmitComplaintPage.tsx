
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitComplaint } from '../../services/complaintService';
import { Complaint, ApiError } from '../../types';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';

type ComplaintFormData = Omit<Complaint, 'id'|'complainant_id'|'status'|'created_at'|'updated_at'|'complaint_uid'|'admin_handler_id'|'resolution_notes'|'closed_at'|'attachments'>;

export const SubmitComplaintPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ComplaintFormData>({
    complaint_type: 'user_behavior', // Default type
    title: '',
    details: '',
    subject_user_id: undefined,
    related_product_id: undefined,
    related_rental_id: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) {
      setError("You must be logged in to submit a complaint.");
      return;
    }
    if (!formData.title || !formData.details || !formData.complaint_type) {
        setError("Please fill in title, details, and complaint type.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await submitComplaint(formData, authUser.id);
      setSuccessMessage("Complaint submitted successfully. We will review it shortly.");
      setFormData({ complaint_type: 'user_behavior', title: '', details: '', subject_user_id: undefined, related_product_id: undefined, related_rental_id: undefined });
      // setTimeout(() => navigate(ROUTE_PATHS.MY_COMPLAINTS), 2000); // Optional redirect
    } catch (err) {
      setError((err as ApiError).message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Submit a Complaint</h1>
      <Card>
        <CardContent>
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="complaint_type" className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                    <select name="complaint_type" id="complaint_type" value={formData.complaint_type} onChange={handleChange} required className="block w-full p-2 border rounded-md shadow-sm">
                        <option value="user_behavior">User Behavior</option>
                        <option value="item_issue_not_claim">Item Issue (not a claim)</option>
                        <option value="platform_bug">Platform Bug/Issue</option>
                        <option value="safety_concern">Safety Concern</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <InputField label="Title / Subject" name="title" value={formData.title} onChange={handleChange} required placeholder="Brief summary of your complaint"/>
                <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                    <textarea name="details" id="details" value={formData.details} onChange={handleChange} required rows={5} className="block w-full p-2 border rounded-md shadow-sm" placeholder="Provide a detailed description of the issue..."></textarea>
                </div>
                <InputField label="Subject User ID (If applicable)" name="subject_user_id" type="number" value={formData.subject_user_id || ''} onChange={handleChange} placeholder="ID of user you are reporting"/>
                <InputField label="Related Product ID (If applicable)" name="related_product_id" type="number" value={formData.related_product_id || ''} onChange={handleChange} placeholder="ID of product involved"/>
                <InputField label="Related Rental ID (If applicable)" name="related_rental_id" type="number" value={formData.related_rental_id || ''} onChange={handleChange} placeholder="ID of rental involved"/>
              
              {/* TODO: File attachments for complaint */}

              <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg">
                Submit Complaint
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
