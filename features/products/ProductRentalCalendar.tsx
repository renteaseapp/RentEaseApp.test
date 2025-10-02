import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
// Import Thai locale for moment - handled in moment.locale() call

// --- !!! หัวใจสำคัญของการแก้ไข !!! ---
// นำเข้า CSS หลักของ React Big Calendar เพื่อให้แสดงผลเป็นตาราง
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { getProductRentalDetails, getBufferTimeSettings } from '../../services/productService'; // Assuming this path is correct
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, X, Info, Hash, Package, Clock, DollarSign, MapPin, Star } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

// --- !!! ไฟล์ CSS ที่เราปรับแต่งเอง !!! ---
// ไฟล์นี้จะใช้ปรับแต่งหน้าตาเพิ่มเติมหลังจากที่ CSS หลักทำงานแล้ว
import './calendar-styles.css';

// Setup moment localizer
const localizer = momentLocalizer(moment);
moment.locale('th'); // Set locale to Thai for month names and day names

// ... (ส่วนของ Type Definitions และ Helper Functions เหมือนเดิม ไม่มีการเปลี่ยนแปลง) ...

interface RentalData {
  id: string;
  start_date: string;
  end_date: string;
  rental_status: string;
  total_price: number;
  quantity: number;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface RentalEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    rentalId: string;
    renterName: string;
    renterEmail: string;
    status: string;
    totalPrice: number;
    quantity: number;
    startDate: string;
    endDate: string;
  };
}

interface BufferEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'delivery_buffer' | 'return_buffer';
    relatedRentalId: string;
    bufferDays: number;
  };
}

interface BufferTimeSettings {
  enabled: boolean;
  delivery_buffer_days: number;
  return_buffer_days: number;
}

interface ProductRentalCalendarProps {
  productId: number;
  productTitle: string;
  compact?: boolean;
}

const getStatusInfo = (status: string): { color: string; text: string } => {
  switch (status) {
    case 'confirmed': return { color: 'bg-green-500', text: 'ยืนยันแล้ว' };
    case 'active': return { color: 'bg-blue-500', text: 'กำลังเช่า' };
    case 'completed': return { color: 'bg-gray-500', text: 'เสร็จสิ้น' };
    case 'pending_payment': return { color: 'bg-yellow-500', text: 'รอชำระเงิน' };
    case 'pending_owner_approval': return { color: 'bg-orange-500', text: 'รออนุมัติ' };
    case 'cancelled': return { color: 'bg-red-500', text: 'ยกเลิก' };
    default: return { color: 'bg-gray-400', text: status };
  }
};

const CustomToolbar = ({ label, onNavigate, onView, view, currentDate, onDateChange }: any) => {
  const currentMoment = moment(currentDate);
  const currentMonth = currentMoment.month();
  const currentYear = currentMoment.year();
  
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const handleMonthChange = (monthIndex: number) => {
    const newDate = currentMoment.clone().month(monthIndex).toDate();
    onDateChange(newDate);
  };
  
  const handleYearChange = (year: number) => {
    const newDate = currentMoment.clone().year(year).toDate();
    onDateChange(newDate);
  };
  
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 md:p-6 gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-gray-100">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('PREV')}
          className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('TODAY')}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm transition-all duration-200 hover:shadow-md px-4"
        >
          วันนี้
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('NEXT')}
          className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <select 
            value={currentMonth} 
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="appearance-none bg-white px-4 py-2 pr-8 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="relative">
          <select 
            value={currentYear} 
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="appearance-none bg-white px-4 py-2 pr-8 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year + 543}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView && onView('month')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              view === 'month' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            เดือน
          </button>
          <button
            onClick={() => onView && onView('week')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              view === 'week' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            สัปดาห์
          </button>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">ปฏิทินการเช่า</span>
        </div>
      </div>
    </div>
  );
};



const CalendarLoadingSkeleton = () => (
    <div className="h-[75vh] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex justify-between items-center mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse shadow-sm"></div>
                <div className="h-9 w-20 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse shadow-sm"></div>
                <div className="h-9 w-9 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse shadow-sm"></div>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-9 w-32 bg-white rounded-lg animate-pulse shadow-sm"></div>
                <div className="h-9 w-24 bg-white rounded-lg animate-pulse shadow-sm"></div>
            </div>
            <div className="h-9 w-36 bg-white rounded-lg animate-pulse shadow-sm hidden md:block"></div>
        </div>
        <div className="flex-grow p-6">
            <div className="grid grid-cols-7 gap-3 h-full">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={`header-${i}`} className="h-12 bg-white rounded-lg animate-pulse shadow-sm"></div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white rounded-lg animate-pulse shadow-sm border border-gray-100"></div>
                ))}
            </div>
        </div>
    </div>
);


// --- Main Component ---
const ProductRentalCalendar: React.FC<ProductRentalCalendarProps> = ({ productId, productTitle, compact = false }) => {
  const [events, setEvents] = useState<RentalEvent[]>([]);
  const [bufferEvents, setBufferEvents] = useState<BufferEvent[]>([]);
  const [bufferSettings, setBufferSettings] = useState<BufferTimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<RentalEvent | null>(null);

  useEffect(() => {
    const fetchRentalData = async (date: Date) => {
      try {
        setLoading(true);
        setSelectedEvent(null);
        
        // Fetch buffer time settings
        const bufferTimeSettings = await getBufferTimeSettings();
        setBufferSettings({
          enabled: bufferTimeSettings.enabled,
          delivery_buffer_days: bufferTimeSettings.delivery_buffer_days,
          return_buffer_days: bufferTimeSettings.return_buffer_days
        });
        
        const yearMonth = moment(date).format('YYYY-MM');
        const rentalDetails = await getProductRentalDetails(productId, yearMonth);
        
        const calendarEvents: RentalEvent[] = rentalDetails.map((rental: RentalData) => {
          // --- !!! การแก้ไขสำคัญ !!! ---
          // react-big-calendar จะไม่นับรวมวันสิ้นสุด (end date is exclusive)
          // หากเช่าถึงวันที่ 7 ต้องบวกไป 1 วันเป็นวันที่ 8 เพื่อให้ช่องวันที่ 7 แสดงผล
          const endDate = moment(rental.end_date).add(1, 'days').toDate();
          
          return {
            id: rental.id,
            title: `${rental.users.first_name}`,
            start: new Date(rental.start_date),
            end: endDate,
            resource: {
              rentalId: rental.id,
              renterName: `${rental.users.first_name} ${rental.users.last_name}`,
              renterEmail: rental.users.email,
              status: rental.rental_status,
              totalPrice: rental.total_price,
              quantity: rental.quantity || 0,
              startDate: rental.start_date,
              endDate: rental.end_date,
            }
          };
        });
        
        // Create buffer events if buffer time is enabled
        const bufferEventsArray: BufferEvent[] = [];
        if (bufferTimeSettings.enabled) {
          rentalDetails.forEach((rental: RentalData) => {
            // Delivery buffer (before rental start)
            if (bufferTimeSettings.delivery_buffer_days > 0) {
              const deliveryBufferStart = moment(rental.start_date)
                .subtract(bufferTimeSettings.delivery_buffer_days, 'days')
                .toDate();
              const deliveryBufferEnd = new Date(rental.start_date);
              
              bufferEventsArray.push({
                id: `delivery-buffer-${rental.id}`,
                title: 'Buffer (จัดส่ง)',
                start: deliveryBufferStart,
                end: deliveryBufferEnd,
                resource: {
                  type: 'delivery_buffer',
                  relatedRentalId: rental.id,
                  bufferDays: bufferTimeSettings.delivery_buffer_days
                }
              });
            }
            
            // Return buffer (after rental end)
            if (bufferTimeSettings.return_buffer_days > 0) {
              const returnBufferStart = moment(rental.end_date).add(1, 'days').toDate();
              const returnBufferEnd = moment(rental.end_date)
                .add(1 + bufferTimeSettings.return_buffer_days, 'days')
                .toDate();
              
              bufferEventsArray.push({
                id: `return-buffer-${rental.id}`,
                title: 'Buffer (รับคืน)',
                start: returnBufferStart,
                end: returnBufferEnd,
                resource: {
                  type: 'return_buffer',
                  relatedRentalId: rental.id,
                  bufferDays: bufferTimeSettings.return_buffer_days
                }
              });
            }
          });
        }
        
        setEvents(calendarEvents);
        setBufferEvents(bufferEventsArray);
      } catch (error) {
        console.error('Error fetching rental data:', error);
        setEvents([]);
        setBufferEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRentalData(currentDate);
  }, [productId, currentDate]);

  const handleNavigate = (newDate: Date, view?: string, action?: string) => {
    setCurrentDate(newDate);
  };

  const handleSelectEvent = (event: RentalEvent) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event: RentalEvent | BufferEvent) => {
    // Check if this is a buffer event
    if ('resource' in event && 'type' in event.resource) {
      const bufferEvent = event as BufferEvent;
      if (bufferEvent.resource.type === 'delivery_buffer') {
        return {
          className: 'bg-orange-400 text-orange-900 border-orange-500 border-2 p-1 text-xs rounded-md cursor-pointer hover:opacity-80 transition-all duration-200 shadow-md',
          style: {
            backgroundColor: '#fb923c',
            color: '#7c2d12',
            border: '2px solid #f97316',
            fontSize: '11px',
            fontWeight: '600',
            zIndex: 999
          }
        };
      } else if (bufferEvent.resource.type === 'return_buffer') {
        return {
          className: 'bg-purple-400 text-purple-900 border-purple-500 border-2 p-1 text-xs rounded-md cursor-pointer hover:opacity-80 transition-all duration-200 shadow-md',
          style: {
            backgroundColor: '#c084fc',
            color: '#581c87',
            border: '2px solid #a855f7',
            fontSize: '11px',
            fontWeight: '600',
            zIndex: 999
          }
        };
      }
    }
    
    // Regular rental event
    const rentalEvent = event as RentalEvent;
    const { color } = getStatusInfo(rentalEvent.resource.status);
    return {
      className: `${color} text-white border-none p-1 text-xs rounded-md cursor-pointer hover:opacity-80 transition-all duration-200 shadow-md`,
      style: {
        fontSize: '11px',
        fontWeight: '600',
        zIndex: 1000
      }
    };
  };

  if (compact) {
    return (
      <div className="bg-white">
        {loading ? (
          <div className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-2 p-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex-grow bg-gray-50 border-t border-gray-200 p-2 animate-pulse">
              <div className="grid grid-cols-7 gap-1 h-full">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] bg-white">
                  <Calendar
                    localizer={localizer}
                    events={[...events, ...bufferEvents]}
                    startAccessor="start"
                    endAccessor="end"
                    date={currentDate}
                    defaultView="month"
                    view="month"
                    onNavigate={handleNavigate}
                    onSelectEvent={handleSelectEvent as any}
                    eventPropGetter={eventStyleGetter as any}
                    components={{ 
                      toolbar: (props: any) => <CustomToolbar {...props} currentDate={currentDate} onDateChange={setCurrentDate} /> 
                    }}
                    culture="th"
                    views={['month']}
                    messages={{
                        next: 'ถัดไป',
                        previous: 'ก่อนหน้า',
                        today: 'วันนี้',
                        month: 'เดือน',
                        week: 'สัปดาห์',
                        day: 'วัน',
                        agenda: 'กำหนดการ',
                        date: 'วันที่',
                        time: 'เวลา',
                        event: 'กิจกรรม',
                        noEventsInRange: 'ไม่มีการเช่าในช่วงเวลานี้',
                        showMore: (total: number) => `+${total} เพิ่มเติม`
                    }}
                  />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* Header with Product Info */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">ปฏิทินการเช่าสินค้า</h2>
              <p className="text-blue-100">ดูสถานะการเช่าและ Buffer Time ของสินค้า</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm text-blue-100">เดือนปัจจุบัน</p>
                <p className="text-lg font-semibold">{moment(currentDate).format('MMMM YYYY')}</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="shadow-xl border-0 bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
                  <CalendarIcon className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">ปฏิทินการเช่าสินค้า</h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    {productTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-100">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Premium Calendar</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {loading ? (
                <CalendarLoadingSkeleton />
              ) : (
                <div className="h-[75vh] bg-gradient-to-br from-white to-gray-50">
                  <Calendar
                    localizer={localizer}
                    events={[...events, ...bufferEvents]}
                    startAccessor="start"
                    endAccessor="end"
                    date={currentDate}
                    defaultView="month"
                    view="month"
                    onNavigate={handleNavigate}
                    onSelectEvent={handleSelectEvent as any}
                    eventPropGetter={eventStyleGetter as any}
                    components={{ 
                      toolbar: (props: any) => <CustomToolbar {...props} currentDate={currentDate} onDateChange={setCurrentDate} /> 
                    }}
                    culture="th"
                    views={['month']} // แสดงเฉพาะมุมมองเดือน
                    messages={{
                        next: 'ถัดไป',
                        previous: 'ก่อนหน้า',
                        today: 'วันนี้',
                        month: 'เดือน',
                        week: 'สัปดาห์',
                        day: 'วัน',
                        agenda: 'กำหนดการ',
                        date: 'วันที่',
                        time: 'เวลา',
                        event: 'กิจกรรม',
                        noEventsInRange: 'ไม่มีการเช่าในช่วงเวลานี้',
                        showMore: (total: number) => `+${total} เพิ่มเติม`
                    }}
                    className="h-[600px] md:h-[700px]"
                    popup
                    popupOffset={30}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-1">
            {/* ... ส่วนของ Event Details เหมือนเดิม ... */}
            {!selectedEvent ? (
                <Card className="shadow-xl border-0 h-full bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
                        <CardTitle className="text-lg font-semibold !text-white flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            รายละเอียดการเช่า
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center text-gray-600 space-y-4">
                        <CalendarIcon className="h-10 w-10 mx-auto text-blue-400" />
                        <p className="font-medium">
                            คลิกที่รายการในปฏิทินเพื่อดูรายละเอียด
                        </p>
                        {bufferSettings && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-left text-sm space-y-3 shadow-sm">
                                <p className="font-semibold text-blue-800 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    การตั้งค่า Buffer Time
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-700">เปิดใช้งาน Buffer Time</span>
                                            <div className={`w-3 h-3 rounded-full ${bufferSettings.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {bufferSettings.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-orange-800">Buffer จัดส่ง</span>
                                                <span className="text-sm font-bold text-orange-600">
                                                    {bufferSettings.delivery_buffer_days} วัน
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-purple-800">Buffer รับคืน</span>
                                                <span className="text-sm font-bold text-purple-600">
                                                    {bufferSettings.return_buffer_days} วัน
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2 bg-white p-2 rounded border border-blue-100">
                                    💡 สีส้ม: Buffer จัดส่ง | สีม่วง: Buffer รับคืน
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
              <Card className="shadow-2xl border-0 animate-in fade-in-50 duration-300 h-full bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-row items-center justify-between rounded-t-xl">
                  <CardTitle className="text-lg font-semibold !text-white flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {'type' in selectedEvent.resource ? 'รายละเอียด Buffer Time' : 'รายละเอียดการเช่า'}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedEvent(null)} 
                    className="!text-white !bg-white/20 hover:bg-white/30 hover:text-white h-8 w-8 rounded-full transition-all duration-200 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50/50">
                  {/* Check if it's a BufferEvent or RentalEvent */}
                  {'type' in selectedEvent.resource ? (
                    // Buffer Event Details
                    (() => {
                      const bufferResource = selectedEvent.resource as unknown as BufferEvent['resource'];
                      return (
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center bg-orange-50 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4 mr-2 text-orange-500" />
                            ข้อมูล Buffer Time
                          </h4>
                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-5 rounded-xl border border-orange-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-10 h-10 ${bufferResource.type === 'delivery_buffer' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                <Clock className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 text-lg">
                                  {bufferResource.type === 'delivery_buffer' ? 'Buffer จัดส่ง' : 'Buffer รับคืน'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {bufferResource.bufferDays} วัน
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">ประเภท</span>
                                <Badge className={bufferResource.type === 'delivery_buffer' ? 'bg-orange-500' : 'bg-purple-500'}>
                                  {bufferResource.type === 'delivery_buffer' ? 'จัดส่ง' : 'รับคืน'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">รหัสการเช่าที่เกี่ยวข้อง</span>
                                <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">{bufferResource.relatedRentalId}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">วันที่เริ่ม</span>
                                <span className="font-semibold">{moment(selectedEvent.start).format('DD MMM YYYY')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">วันที่สิ้นสุด</span>
                                <span className="font-semibold">{moment(selectedEvent.end).format('DD MMM YYYY')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Rental Event Details
                    <>
                      {/* Renter Info */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                          <User className="h-4 w-4 mr-2 text-blue-500" />
                          ข้อมูลผู้เช่า
                        </h4>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(selectedEvent.resource as RentalEvent['resource']).renterName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-lg">{(selectedEvent.resource as RentalEvent['resource']).renterName || 'ไม่ระบุ'}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {(selectedEvent.resource as RentalEvent['resource']).renterEmail || 'ไม่ระบุ'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rental Details - แสดงเฉพาะเมื่อเป็น RentalEvent */}
                  {!('type' in selectedEvent.resource) && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center bg-green-50 px-3 py-2 rounded-lg">
                        <CalendarIcon className="h-4 w-4 mr-2 text-green-500" />
                        ข้อมูลการเช่า
                      </h4>
                      <div className="space-y-5 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center"><Hash className="h-4 w-4 mr-2" />รหัส</span>
                          <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">{selectedEvent.resource.rentalId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center"><Package className="h-4 w-4 mr-2" />จำนวน</span>
                          <span className="font-semibold">1 ชิ้น</span>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                          <Info className="h-3 w-3 inline mr-1" />
                          ระบบเช่าทีละ 1 ชิ้นเท่านั้น
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">สถานะ</span>
                          <Badge className={`${getStatusInfo(selectedEvent.resource.status).color} text-white`}>
                              {getStatusInfo(selectedEvent.resource.status).text}
                          </Badge>
                        </div>
                        <div className="border-t my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">เริ่มเช่า</span>
                          <span className="font-semibold">{moment(selectedEvent.start).format('DD MMM YYYY')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">สิ้นสุด</span>
                          <span className="font-semibold">{moment(selectedEvent.resource.endDate).format('DD MMM YYYY')}</span>
                        </div>
                         <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center"><Clock className="h-4 w-4 mr-2" />ระยะเวลา</span>
                          <span className="font-semibold">
                            {moment(selectedEvent.resource.endDate).diff(moment(selectedEvent.start), 'days') + 1} วัน
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Info - แสดงเฉพาะเมื่อมี totalPrice และเป็น RentalEvent */}
                  {!('type' in selectedEvent.resource) && selectedEvent.resource.totalPrice && selectedEvent.resource.totalPrice > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wider flex items-center justify-center"><DollarSign className="h-4 w-4 mr-2" />ยอดรวม</h4>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          ฿{selectedEvent.resource.totalPrice.toLocaleString()}
                        </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <Card className="shadow-md border-0 bg-white">
            <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    คำอธิบายสถานะ
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Rental Status Legend */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">สถานะการเช่า</h4>
                        <div className="space-y-2">
                            {['confirmed', 'active', 'completed', 'pending_payment', 'pending_owner_approval', 'cancelled'].map(status => {
                                const { color, text } = getStatusInfo(status);
                                return (
                                    <div key={status} className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                        <span className="text-xs text-gray-600">{text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Buffer Time Legend */}
                    {bufferSettings?.enabled && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Buffer Time</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-orange-500"></div>
                                    <span className="text-xs text-gray-600">Buffer (จัดส่ง)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-400 border-2 border-purple-500"></div>
                                    <span className="text-xs text-gray-600">Buffer (รับคืน)</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <p>• Buffer จัดส่ง: {bufferSettings.delivery_buffer_days} วัน</p>
                                <p>• Buffer รับคืน: {bufferSettings.return_buffer_days} วัน</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Calendar Tips */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">การใช้งาน</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• คลิกที่ event เพื่อดูรายละเอียด</p>
                            <p>• ใช้ปุ่มนำทางเพื่อเปลี่ยนเดือน</p>
                            <p>• Buffer time จะแสดงอัตโนมัติ</p>
                        </div>
                    </div>
                    
                    {/* Statistics */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">สถิติ</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• รายการเช่าทั้งหมด: {events.length}</p>
                            <p>• Buffer events: {bufferEvents.length}</p>
                            <p>• เดือนปัจจุบัน: {moment(currentDate).format('MMMM YYYY')}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductRentalCalendar;