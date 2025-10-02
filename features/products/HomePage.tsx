import React, { useEffect, useState } from 'react';
import { Product, ApiError } from '../../types';
import { getPopularProducts } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';

import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaSearch, 
  FaBoxOpen, 
  FaTags, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaHeadset, 
  FaUserPlus, 
  FaListOl, 
  FaTruck, 
  FaUndo,
  FaArrowRight,
  FaStar,
  FaUsers,
  FaGift
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, TrendingUp, Award } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  const fetchPopularProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const response = await getPopularProducts(8);
      setPopularProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const apiError = err as ApiError;
      setProductsError(apiError.message || 'เกิดข้อผิดพลาดในการโหลดสินค้า');
      console.error('Error fetching popular products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`${ROUTE_PATHS.SEARCH_PRODUCTS}?q=${searchTerm}`);
  };

  useEffect(() => {
    fetchPopularProducts();
  }, [navigate]);

  const stats = [
    { icon: <Sparkles className="text-blue-500 text-2xl" />, number: 'AI-Powered', label: 'ระบบค้นหาอัจฉริยะ' },
    { icon: <FaShieldAlt className="text-green-500 text-2xl" />, number: '24/7', label: 'ระบบรักษาความปลอดภัย' },
    { icon: <MessageCircle className="text-yellow-500 text-2xl" />, number: 'Real-time', label: 'แชทสดกับเจ้าของ' },
    { icon: <TrendingUp className="text-purple-500 text-2xl" />, number: 'Smart', label: 'ระบบจัดการอัตโนมัติ' },
  ];

  const howItWorks = [
    { 
      icon: <FaSearch className="text-blue-500 text-3xl" />, 
      title: 'ค้นหาสินค้า', 
      desc: 'ค้นหาสินค้าที่คุณต้องการเช่าจากหมวดหมู่หรือคำค้นหา',
      step: '01'
    },
    { 
      icon: <FaListOl className="text-green-500 text-3xl" />, 
      title: 'จองสินค้า', 
      desc: 'เลือกวันที่ต้องการเช่าและทำการจองสินค้า',
      step: '02'
    },
    { 
      icon: <FaTruck className="text-yellow-500 text-3xl" />, 
      title: 'รับสินค้า', 
      desc: 'นัดหมายรับสินค้ากับเจ้าของหรือให้จัดส่งถึงมือ',
      step: '03'
    },
    { 
      icon: <FaUndo className="text-purple-500 text-3xl" />, 
      title: 'คืนสินค้า', 
      desc: 'คืนสินค้าตามวันที่กำหนดและรับเงินประกันคืน',
      step: '04'
    },
  ];

  const features = [
    { 
      icon: <FaTags className="text-blue-500 text-2xl" />, 
      title: 'ราคาดี คุ้มค่า',
      desc: 'เช่าสินค้าในราคาที่เหมาะสมยัดกว่าซื้อใหม่'
    },
    { 
      icon: <FaShieldAlt className="text-green-500 text-2xl" />, 
      title: 'ปลอดภัย เชื่อถือได้',
      desc: 'ระบบรักษาความปลอดภัยระดับสูง พร้อมประกันสินค้า'
    },
    { 
      icon: <FaCheckCircle className="text-yellow-500 text-2xl" />, 
      title: 'หลากหลาย ครบครัน',
      desc: 'สินค้าหลากหลายประเภท ตอบสนองทุกความต้องการ'
    },
    { 
      icon: <FaHeadset className="text-purple-500 text-2xl" />, 
      title: 'บริการดี รวดเร็ว',
      desc: 'ทีมงานพร้อมให้บริการ 24/7 ตอบสนองอย่างรวดเร็ว'
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6"
              >
                <Sparkles className="w-5 h-5 text-yellow-300 mr-2" />
                <span className="text-white font-medium">แพลตฟอร์มเช่าสินค้าอันดับ 1</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              >
                เช่าสินค้า
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  ง่าย รวดเร็ว ปลอดภัย
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0"
              >
                ประหยัดเงิน ประหยัดพื้นที่ เช่าสินค้าคุณภาพีได้ทุกเมื่อ
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-8"
              >
                <form onSubmit={handleSearch} className="flex max-w-md mx-auto lg:mx-0">
                  <div className="relative flex-grow">
                    <input 
                      type="search" 
                      placeholder="ค้นหาสินค้าที่ต้องการ..."
                      className="w-full p-4 pr-12 text-gray-800 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 border-0"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-yellow-400 hover:bg-yellow-500 transition-all duration-300 text-gray-900 font-semibold px-8 rounded-r-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    ค้นหา
                  </button>
                </form>
              </motion.div>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to={ROUTE_PATHS.SEARCH_PRODUCTS}
                  className="group bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1"
                >
                  <FaBoxOpen className="group-hover:scale-110 transition-transform" /> 
                  เริ่มเช่าสินค้า
                </Link>
                <Link
                  to={ROUTE_PATHS.MY_LISTINGS}
                  className="group bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1"
                >
                  <FaGift className="group-hover:scale-110 transition-transform" /> 
                  ให้เช่าสินค้า
                </Link>
              </motion.div>
            </div>

            {/* Right Content - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-2 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex justify-center mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-blue-100 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้องเลือกเรา?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              เราให้บริการเช่าสินค้าที่ครบครันและน่าเชื่อถือที่สุด
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Powered Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-gray-900" />
                </div>
              </div>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ระบบ AI ช่วยค้นหาสินค้า
              </span>
            </h3>
            
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              ใช้เทคโนโลยีปัญญาประดิษฐ์ในการแนะนำสินค้าที่ตรงกับความต้องการของคุณอย่างแม่นยำ
              พร้อมระบบการค้นหาอัจฉริยะที่เข้าใจสิ่งที่คุณต้องการ
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                <span className="text-gray-700 font-medium">🎯 แนะนำสินค้าตรงใจ</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                <span className="text-gray-700 font-medium">⚡ ค้นหาทันใจ</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                <span className="text-gray-700 font-medium">🧠 เรียนรู้ความชอบ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Popular Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                สินค้ายอดนิยม
              </h2>
              <p className="text-xl text-gray-600">
                สินค้าที่ได้รับความนิยมสูงสุดจากผู้ใช้งาน
              </p>
            </div>
            <Link 
              to={ROUTE_PATHS.SEARCH_PRODUCTS} 
              className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1"
            >
              ดูสินค้าทั้งหมด 
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg h-96 animate-pulse"></div>
              ))}
            </div>
          ) : productsError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl shadow-lg"
            >
              <ErrorMessage message={productsError} title="ข้อผิดพลาด" />
              <Button 
                variant="primary" 
                onClick={fetchPopularProducts}
                className="mt-6 px-8 py-3 rounded-xl"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {Array.isArray(popularProducts) && popularProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="transform transition-all duration-300"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {(!Array.isArray(popularProducts) || popularProducts.length === 0) && !isLoadingProducts && !productsError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-2xl shadow-lg"
            >
              <FaBoxOpen className="mx-auto text-6xl text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-500 mb-2">ไม่พบสินค้าแนะนำในขณะนี้</h3>
              <p className="text-gray-400">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              วิธีการใช้งาน
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              เริ่มต้นช่าสินค้าได้ง่ายๆ ใน 4 ขั้นตอน
            </p>
          </motion.div>
          
          <div className="relative">
            <div className="hidden lg:block absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-purple-500 transform -translate-y-1/2 rounded-full"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -10 }}
                  className="relative bg-white lg:bg-transparent z-10"
                >
                  <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg lg:shadow-none hover:shadow-xl transition-all duration-300">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold lg:block hidden">
                      {step.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      {!user && (
        <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl"></div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl p-12 md:p-16 inline-block border border-white/20"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <FaUserPlus className="text-2xl text-gray-900" />
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                เริ่มต้นใช้งานฟรีวันนี้
              </h3>
              
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย เริ่มเช่าหรือให้เช่าสินค้าได้ทันที
                พร้อมรับสิทธิพิเศษมากมาย
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to={ROUTE_PATHS.REGISTER} 
                  className="group inline-flex items-center justify-center px-10 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <FaUserPlus className="mr-3 group-hover:scale-110 transition-transform" />
                  สมัครสมาชิกฟรี
                </Link>
                
                <Link 
                  to={ROUTE_PATHS.SEARCH_PRODUCTS} 
                  className="group inline-flex items-center justify-center px-10 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/30"
                >
                  <TrendingUp className="mr-3 group-hover:scale-110 transition-transform" />
                  เริ่มเช่าเลย
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
    );
  };