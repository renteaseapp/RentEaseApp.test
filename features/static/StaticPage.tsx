
import React, { useEffect, useState } from 'react';
import { getStaticPage } from '../../services/staticPageService';
import { StaticPageContent, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FaInfoCircle, 
  FaShieldAlt, 
  FaFileContract, 
  FaUserShield,
  FaCalendarAlt,
  FaClock,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaBookOpen,
  FaHandshake,
  FaBalanceScale
} from 'react-icons/fa';

interface StaticPageProps {
  pageSlug: string;
}

const getPageIcon = (pageSlug: string) => {
  switch (pageSlug) {
    case 'about-us':
      return <FaInfoCircle className="w-6 h-6" />;
    case 'terms-of-service':
      return <FaFileContract className="w-6 h-6" />;
    case 'privacy-policy':
      return <FaUserShield className="w-6 h-6" />;
    default:
      return <FaBookOpen className="w-6 h-6" />;
  }
};

const getPageGradient = (pageSlug: string) => {
  switch (pageSlug) {
    case 'about-us':
      return 'from-blue-500 to-cyan-600';
    case 'terms-of-service':
      return 'from-purple-500 to-indigo-600';
    case 'privacy-policy':
      return 'from-green-500 to-emerald-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const getPageTitle = (pageSlug: string, t: any) => {
  switch (pageSlug) {
    case 'about-us':
      return t('aboutPage.title');
    case 'terms-of-service':
      return t('termsPage.title');
    case 'privacy-policy':
      return t('privacyPage.title');
    default:
      return 'Page Content';
  }
};

export const StaticPage: React.FC<StaticPageProps> = ({ pageSlug }) => {
  const { t } = useTranslation();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
        <LoadingSpinner message={`Loading ${pageSlug}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!pageContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <FaBookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-500">The requested page content could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${getPageGradient(pageSlug)} rounded-2xl mb-6`}>
              {getPageIcon(pageSlug)}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {getPageTitle(pageSlug, t)}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4" />
                <span>Last updated: {new Date(pageContent.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span>Reading time: ~5 min</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white shadow-xl border border-gray-100 overflow-hidden">
            {/* Content Header */}
            <div className={`bg-gradient-to-r ${getPageGradient(pageSlug)} px-6 py-4`}>
              <div className="flex items-center gap-3">
                <div className="text-white">
                  {getPageIcon(pageSlug)}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {pageContent.title || getPageTitle(pageSlug, t)}
                </h2>
              </div>
            </div>

            <CardContent className="p-8">
              {/* Table of Contents for long content */}
              {pageSlug === 'terms-of-service' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaBalanceScale className="w-5 h-5 text-blue-600" />
                    Table of Contents
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Terms of Use</li>
                    <li>• User Responsibilities</li>
                    <li>• Payment Terms</li>
                    <li>• Dispute Resolution</li>
                    <li>• Termination</li>
                  </ul>
                </motion.div>
              )}

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="prose prose-lg max-w-none"
              >
                {pageSlug === 'about-us' && (
                  <div dangerouslySetInnerHTML={{ __html: t('aboutPage.content') }} />
                )}
                {pageSlug === 'terms-of-service' && (
                  <div dangerouslySetInnerHTML={{ __html: t('termsPage.content') }} />
                )}
                {pageSlug === 'privacy-policy' && (
                  <div dangerouslySetInnerHTML={{ __html: t('privacyPage.content') }} />
                )}
                {!['about-us', 'terms-of-service', 'privacy-policy'].includes(pageSlug) && (
                  <div dangerouslySetInnerHTML={{ __html: pageContent.content_html }} />
                )}
              </motion.div>

              {/* Footer Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-12 pt-8 border-t border-gray-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4" />
                      <span>Last updated: {new Date(pageContent.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="w-4 h-4" />
                      <span>Version 1.0</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <FaExternalLinkAlt className="w-4 h-4" />
                      <span>Print this page</span>
                    </button>
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <FaHandshake className="w-4 h-4" />
                      <span>Contact us</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Related Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Related Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/about-us" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaInfoCircle className="w-5 h-5" />
                  <span>About Us</span>
                </a>
                <a href="/terms-of-service" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaFileContract className="w-5 h-5" />
                  <span>Terms of Service</span>
                </a>
                <a href="/privacy-policy" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaUserShield className="w-5 h-5" />
                  <span>Privacy Policy</span>
                </a>
              </div>
        </CardContent>
      </Card>
        </motion.div>
      </div>
    </div>
  );
};
