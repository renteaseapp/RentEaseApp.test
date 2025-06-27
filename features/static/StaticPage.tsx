
import React, { useEffect, useState } from 'react';
import { getStaticPage } from '../../services/staticPageService';
import { StaticPageContent, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';

interface StaticPageProps {
  pageSlug: string;
}

export const StaticPage: React.FC<StaticPageProps> = ({ pageSlug }) => {
  const [pageContent, setPageContent] = useState<StaticPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getStaticPage(pageSlug)
      .then(setPageContent)
      .catch(err => setError((err as ApiError).message || `Failed to load content for ${pageSlug}.`))
      .finally(() => setIsLoading(false));
  }, [pageSlug]);

  if (isLoading) return <LoadingSpinner message={`Loading ${pageSlug}...`} />;
  if (error) return <ErrorMessage message={error} />;
  if (!pageContent) return <div className="p-4 text-center">Page content not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardContent>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{pageContent.title}</h1>
          <div 
            className="prose lg:prose-xl max-w-none" 
            dangerouslySetInnerHTML={{ __html: pageContent.content_html }} 
          />
          <p className="text-xs text-gray-400 mt-8">Last updated: {new Date(pageContent.updated_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
};
