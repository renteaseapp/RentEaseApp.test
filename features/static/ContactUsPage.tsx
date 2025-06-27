
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { submitContactForm } from '../../services/staticPageService';
import { ContactFormPayload, ApiError } from '../../types';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const ContactUsPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormPayload>({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await submitContactForm(formData);
      setSuccessMessage(response.message);
      setFormData({ name: '', email: '', subject: '', message: '', phone: '' }); // Reset form
    } catch (err) {
      setError((err as ApiError).message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Contact Us</h1>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent>
            <p className="text-gray-600 mb-6 text-center">
              Have questions or feedback? Fill out the form below and we'll get back to you as soon as possible.
            </p>
            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
            {successMessage && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md shadow">
                <p className="font-bold">Message Sent!</p>
                <p>{successMessage}</p>
              </div>
            )}
            {!successMessage && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Your Name" name="name" value={formData.name} onChange={handleChange} required />
                        <InputField label="Your Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <InputField label="Phone Number (Optional)" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
                    <InputField label="Subject" name="subject" value={formData.subject} onChange={handleChange} required />
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea 
                            id="message" 
                            name="message" 
                            value={formData.message} 
                            onChange={handleChange} 
                            required 
                            rows={5}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg" fullWidth>
                        Send Message
                    </Button>
                </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
