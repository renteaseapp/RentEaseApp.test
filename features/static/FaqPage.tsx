
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaQuestionCircle, 
  FaChevronDown, 
  FaLightbulb, 
  FaShieldAlt, 
  FaCreditCard, 
  FaUserFriends,
  FaSearch,
  FaBookOpen
} from 'react-icons/fa';

const AccordionItem: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  index: number;
  categoryIcon?: React.ReactNode;
}> = ({ title, children, index, categoryIcon }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <motion.div 
          className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -2 }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-6 px-6 text-left font-semibold text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    {categoryIcon && (
                        <div className="text-blue-500">
                            {categoryIcon}
                        </div>
                    )}
                    <span className="text-lg">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-blue-500"
                >
                    <FaChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                            <div className="border-t border-gray-100 pt-4">
                                <p className="whitespace-pre-line text-base">{children}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const getCategoryIcon = (categoryTitle: string) => {
    const title = categoryTitle.toLowerCase();
    if (title.includes('general') || title.includes('basic')) return <FaQuestionCircle className="w-5 h-5" />;
    if (title.includes('rental') || title.includes('booking')) return <FaCreditCard className="w-5 h-5" />;
    if (title.includes('safety') || title.includes('security')) return <FaShieldAlt className="w-5 h-5" />;
    if (title.includes('tips') || title.includes('advice')) return <FaLightbulb className="w-5 h-5" />;
    if (title.includes('account') || title.includes('profile')) return <FaUserFriends className="w-5 h-5" />;
    return <FaBookOpen className="w-5 h-5" />;
};

export const FaqPage: React.FC = () => {
  const faqData = [
    {
      title: "ทั่วไป",
      faqs: [
        { q: "RentEase คืออะไร?", a: "RentEase คือแพลตฟอร์มสำหรับเช่าและให้เช่าสินค้าได้อย่างง่ายดายและปลอดภัย" },
        { q: "สมัครสมาชิกอย่างไร?", a: "คลิก 'สมัครสมาชิก' และกรอกรายละเอียด จากนั้นยืนยันอีเมล" }
      ]
    },
    {
      title: "การเช่าสินค้า",
      faqs: [
        { q: "เช่าสินค้าอย่างไร?", a: "ค้นหาสินค้าที่ต้องการ กด 'ขอเช่าสินค้า' และทำตามขั้นตอน" },
        { q: "ขั้นตอนการเช่าสินค้าเป็นอย่างไร?", a: "1. ค้นหาสินค้าที่ต้องการ\n2. กด 'ขอเช่าสินค้า'\n3. เลือกวันที่เช่าและวิธีรับสินค้า\n4. ส่งคำขอเช่าและรอเจ้าของอนุมัติ\n5. ชำระเงินหลังได้รับการอนุมัติ\n6. รับสินค้าและใช้งาน\n7. คืนสินค้าตามกำหนด" }
      ]
    }
  ];

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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
              <FaQuestionCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              คำถามที่พบบ่อย
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ค้นหาคำตอบสำหรับคำถามที่พบบ่อยเกี่ยวกับแพลตฟอร์มการเช่าของเรา
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {faqData && faqData.length > 0 ? (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {faqData.map((category: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-white">
                        {getCategoryIcon(category.title)}
                      </div>
                      <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {category.faqs && category.faqs.length > 0 ? (
                      <div className="space-y-4">
                        {category.faqs.map((faq: any, fidx: number) => (
                          <AccordionItem 
                            key={fidx} 
                            title={faq.q}
                            index={fidx}
                            categoryIcon={getCategoryIcon(category.title)}
                          >
                            <p className="whitespace-pre-line">{faq.a}</p>
                          </AccordionItem>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                      >
                        <FaBookOpen className="mx-auto text-4xl text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">
                          ยังไม่มีคำถามที่พบบ่อยในหมวดหมู่นี้
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
              <FaQuestionCircle className="mx-auto text-6xl text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                ไม่มีคำถามที่พบบ่อย
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-lg">
                เรากำลังทำงานเพื่อเพิ่มคำถามที่พบบ่อยที่เป็นประโยชน์ โปรดกลับมาตรวจสอบอีกครั้ง!
              </p>
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <FaSearch className="mx-auto text-4xl mb-4" />
              <h3 className="text-2xl font-bold mb-3">
                ยังต้องการความช่วยเหลือใช่หรือไม่?
              </h3>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                ไม่พบสิ่งที่คุณกำลังมองหา? ทีมสนับสนุนของเราพร้อมช่วยเหลือคุณ
              </p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200">
                ติดต่อฝ่ายสนับสนุน
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
