
import React, { useEffect, useState } from 'react';

import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const faqData = t('faqPage.categories', { returnObjects: true }) as Array<any>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('faqPage.title')}</h1>
      {faqData && faqData.length > 0 ? (
        <div className="space-y-8">
          {faqData.map((category: any, idx: number) => (
            <Card key={idx}>
              <CardContent>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">{category.title}</h2>
                {category.faqs && category.faqs.length > 0 ? (
                  <div className="space-y-2">
                    {category.faqs.map((faq: any, fidx: number) => (
                      <AccordionItem key={fidx} title={faq.q}>
                        <p className="whitespace-pre-line">{faq.a}</p>
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
