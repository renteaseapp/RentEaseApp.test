import React, { useEffect, useState } from 'react';
import { getStaticPage } from '../../services/staticPageService';
import { StaticPageContent, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';

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

const getPageTitle = (pageSlug: string) => {
  switch (pageSlug) {
    case 'about-us':
      return "เกี่ยวกับเรา";
    case 'terms-of-service':
      return "ข้อกำหนดและเงื่อนไข";
    case 'privacy-policy':
      return "นโยบายความเป็นส่วนตัว";
    default:
      return 'เนื้อหาหน้าเว็บ';
  }
};

// เนื้อหาจำลองสำหรับ About Us
const aboutPageContent = `
  <h2>ยินดีต้อนรับสู่แพลตฟอร์มการเช่าของเรา</h2>
  <p>เราก่อตั้งขึ้นด้วยความเชื่อที่ว่าการแบ่งปันทรัพยากรเป็นวิธีที่มีประสิทธิภาพและยั่งยืนในการใช้สินค้าต่างๆ แทนที่จะต้องซื้อใหม่ทั้งหมด</p>
  
  <h3>พันธกิจของเรา</h3>
  <p>พันธกิจของเราคือการสร้างชุมชนที่ผู้คนสามารถเช่าและให้เช่าสินค้าได้อย่างง่ายดาย ปลอดภัย และเชื่อถือได้ เพื่อให้ทุกคนเข้าถึงสิ่งที่ต้องการได้โดยไม่ต้องเป็นเจ้าของ</p>
  
  <h3>ทำไมต้องเลือกเรา?</h3>
  <ul>
    <li><strong>ความปลอดภัย:</strong> เรามีระบบการยืนยันตัวตนสำหรับทั้งผู้เช่าและผู้ให้เช่า</li>
    <li><strong>ความหลากหลาย:</strong> ค้นหาสินค้าหลากหลายประเภท ตั้งแต่อุปกรณ์อิเล็กทรอนิกส์ไปจนถึงเครื่องมือช่าง</li>
    <li><strong>ความยืดหยุ่น:</strong> เลือกช่วงเวลาเช่าได้ตามต้องการ ทั้งรายวัน รายสัปดาห์ หรือรายเดือน</li>
  </ul>
`;

// เนื้อหาจำลองสำหรับ Terms of Service
const termsPageContent = `
  <h2>1. ข้อตกลงทั่วไป</h2>
  <p>การใช้บริการของเราถือว่าท่านยอมรับและผูกพันตามข้อกำหนดและเงื่อนไขเหล่านี้</p>
  
  <h3>2. ความรับผิดชอบของผู้ใช้</h3>
  <ul>
    <li>ผู้ใช้ตกลงที่จะให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันเสมอ</li>
    <li>ผู้เช่าตกลงที่จะดูแลรักษาสินค้าให้มีสภาพดี และส่งคืนตามกำหนดเวลา</li>
  </ul>
  
  <h3>3. การชำระเงิน</h3>
  <p>การชำระเงินทั้งหมดต้องทำผ่านระบบของแพลตฟอร์ม และผู้เช่าตกลงที่จะชำระเงินประกันตามที่กำหนด</p>

  <h3>4. การระงับข้อพิพาท</h3>
  <p>ข้อพิพาทใดๆ ที่เกิดขึ้นจะถูกระงับตามกระบวนการของแพลตฟอร์ม และหากจำเป็นจะถูกนำไปสู่การไกล่เกลี่ยตามกฎหมายไทย</p>
`;

// เนื้อหาจำลองสำหรับ Privacy Policy
const privacyPageContent = `
  <h2>1. การเก็บรวบรวมข้อมูล</h2>
  <p>เราเก็บรวบรวมข้อมูลส่วนบุคคลที่จำเป็นสำหรับการให้บริการ เช่น ชื่อ, ที่อยู่, อีเมล, และข้อมูลการชำระเงิน</p>
  
  <h3>2. การใช้ข้อมูล</h3>
  <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
  <ul>
    <li>ยืนยันตัวตนและสร้างบัญชีผู้ใช้</li>
    <li>ประมวลผลการทำธุรกรรมการเช่าและชำระเงิน</li>
    <li>ปรับปรุงและพัฒนาคุณภาพของบริการ</li>
  </ul>
  
  <h3>3. การแบ่งปันข้อมูล</h3>
  <p>เราจะไม่แบ่งปันข้อมูลส่วนบุคคลของคุณกับบุคคลที่สาม ยกเว้นในกรณีที่จำเป็นต่อการทำธุรกรรม (เช่น การเปิดเผยชื่อและที่อยู่ให้แก่คู่ค้าเพื่อการจัดส่ง) หรือตามที่กฎหมายกำหนด</p>
  
  <h3>4. ความปลอดภัยของข้อมูล</h3>
  <p>เราใช้มาตรการทางเทคนิคและการบริหารจัดการเพื่อป้องกันการเข้าถึง การใช้ หรือการเปิดเผยข้อมูลส่วนบุคคลของคุณโดยไม่ได้รับอนุญาต</p>
`;


export const StaticPage: React.FC<StaticPageProps> = ({ pageSlug }) => {
  const [pageContent, setPageContent] = useState<StaticPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getStaticPage(pageSlug)
      .then(setPageContent)
      .catch(err => setError((err as ApiError).message || `ไม่สามารถโหลดเนื้อหาหน้า ${pageSlug} ได้`))
      .finally(() => setIsLoading(false));
  }, [pageSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
        <LoadingSpinner message={`กำลังโหลด ${getPageTitle(pageSlug)}...`} />
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

  // ใช้เนื้อหาจำลองหาก API คืนค่าว่าง
  let contentHtml = pageContent?.content_html;
  if (!contentHtml) {
    switch (pageSlug) {
      case 'about-us': contentHtml = aboutPageContent; break;
      case 'terms-of-service': contentHtml = termsPageContent; break;
      case 'privacy-policy': contentHtml = privacyPageContent; break;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
            <div className="text-center">
              <FaBookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">{"ไม่พบหน้าเว็บ"}</h2>
              <p className="text-gray-500">{"ไม่พบเนื้อหาของหน้าที่คุณร้องขอ"}</p>
            </div>
          </div>
        );
    }
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
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${getPageGradient(pageSlug)} rounded-2xl mb-6 text-white`}>
              {getPageIcon(pageSlug)}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {getPageTitle(pageSlug)}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4" />
                <span>{"อัปเดตล่าสุด"}: {new Date(pageContent?.updated_at || new Date()).toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span>{"เวลาอ่าน"}: ~5 {"นาที"}</span>
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
                  {pageContent?.title || getPageTitle(pageSlug)}
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
                    {"สารบัญ"}
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• {"ข้อกำหนดการใช้งาน"}</li>
                    <li>• {"ความรับผิดชอบของผู้ใช้"}</li>
                    <li>• {"เงื่อนไขการชำระเงิน"}</li>
                    <li>• {"การระงับข้อพิพาท"}</li>
                    <li>• {"การยกเลิกบริการ"}</li>
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
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
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
                      <span>{"อัปเดตล่าสุด"}: {new Date(pageContent?.updated_at || new Date()).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="w-4 h-4" />
                      <span>{"เวอร์ชัน 1.0"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <FaExternalLinkAlt className="w-4 h-4" />
                      <span>{"พิมพ์หน้านี้"}</span>
                    </button>
                    <a href="/contact" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <FaHandshake className="w-4 h-4" />
                      <span>{"ติดต่อเรา"}</span>
                    </a>
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
              <h3 className="text-lg font-bold mb-4">{"ข้อมูลที่เกี่ยวข้อง"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/about-us" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaInfoCircle className="w-5 h-5" />
                  <span>{"เกี่ยวกับเรา"}</span>
                </a>
                <a href="/terms-of-service" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaFileContract className="w-5 h-5" />
                  <span>{"ข้อกำหนดและเงื่อนไข"}</span>
                </a>
                <a href="/privacy-policy" className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all">
                  <FaUserShield className="w-5 h-5" />
                  <span>{"นโยบายความเป็นส่วนตัว"}</span>
                </a>
              </div>
        </CardContent>
      </Card>
        </motion.div>
      </div>
    </div>
  );
};