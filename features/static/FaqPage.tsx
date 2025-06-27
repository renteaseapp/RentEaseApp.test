
import React, { useEffect, useState } from 'react';
import { getFaqs } from '../../services/staticPageService';
import { FaqCategory, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-4 px-2 text-left font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="p-4 pt-0 text-gray-600">{children}</div>}
        </div>
    );
};

export const FaqPage: React.FC = () => {
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getFaqs()
      .then(setFaqCategories)
      .catch(err => setError((err as ApiError).message || "Failed to load FAQs."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading FAQs..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h1>
      
      {faqCategories.length > 0 ? (
        <div className="space-y-8">
          {faqCategories.map(category => (
            <Card key={category.id}>
              <CardContent>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">{category.name}</h2>
                {category.faqs && category.faqs.length > 0 ? (
                    <div className="space-y-2">
                        {category.faqs.map(faq => (
                            <AccordionItem key={faq.id} title={faq.question}>
                                <p className="whitespace-pre-line">{faq.answer}</p>
                            </AccordionItem>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No FAQs in this category yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">No FAQs available at the moment.</p>
      )}
    </div>
  );
};
