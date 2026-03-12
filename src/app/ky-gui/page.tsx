// app/consignment/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
// import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
// import { cn } from '@/lib/utils';
import BookingForm from './BookingForm'; // giả định path đúng
import InstrumentForm from './InstrumentForm';
import SearchForm from './SearchForm';
// import SearchForm from './components/SearchForm';
// import InstrumentForm from './components/InstrumentForm';

import kyguiZalo from '@images/kyguiquantam.jpg';

export default function ConsignmentPage() {
  // const searchParams = useSearchParams();
  // const searchParams = new URLSearchParams(window?.location?.search);
  // const tab = searchParams.get('tab');

  const [isShowText1, setIsShowText1] = useState(false);
  const [isShowText2, setIsShowText2] = useState(false);
  const [isShowText3, setIsShowText3] = useState(false);
  const [isShowText, setIsShowText] = useState(false);
  const [isShowForm, setIsShowForm] = useState(false);
  const [isShowBookingForm, setIsShowBookingForm] = useState(false);
  const [isShowSearchForm, setIsShowSearchForm] = useState(false);
  const [isShowInstrumentForm, setIsShowInstrumentForm] = useState(false);
  const [isShowBookingOnline, setIsShowBookingOnline] = useState(true);
  const [bookingOnlineAlert, setBookingOnlineAlert] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    // Giả lập lấy setting từ API hoặc env/localStorage (thay Redux)
    // Trong thực tế: fetch từ API hoặc dùng context/global state
    const isShowOnline = true; // hoặc fetch('IS_SHOW_BOOKING_ONLINE_FORM') === 'true'
    const alertMsg = null; // hoặc fetch('BOOKING_ONLINE_ALERT')

    setIsShowBookingOnline(isShowOnline);
    setBookingOnlineAlert(alertMsg);

    // Xử lý query tab
    // if (tab === 'phuongthuc') {
    //   handleOpenContent('instrument');
    //   return;
    // }
    // if (tab === 'datlich') {
    //   handleOpenContent('consignment');
    //   return;
    // }
    // if (tab === 'xemtongket') {
    //   handleOpenContent('search');
    //   return;
    // }

    // Animation fade-in
    const timer = setTimeout(() => {
      setIsShowText(true);
      setIsShowText1(true);
      setIsShowText2(true);
      setIsShowText3(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenContent = (
    formName: 'consignment' | 'search' | 'instrument'
  ) => {
    setIsShowText1(false);
    setIsShowText2(false);
    setIsShowText3(false);
    setIsShowText(false);

    setTimeout(() => {
      setIsShowForm(true);
      setIsShowBookingForm(formName === 'consignment');
      setIsShowSearchForm(formName === 'search');
      setIsShowInstrumentForm(formName === 'instrument');
    }, 500);
  };

  const handleBackConsignment = () => {
    setIsShowForm(false);
    setIsShowText1(true);
    setIsShowText2(true);
    setIsShowText3(true);
    setIsShowText(true);
  };

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  const renderBookingAlert = () => (
    <div className="p-6 bg-white rounded-xl max-w-lg w-full mx-4">
      <h3 className="text-xl font-bold mb-4 text-center">Thông báo</h3>
      {/* {bookingOnlineAlert && (
        <textarea
          disabled
          value={bookingOnlineAlert}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y bg-gray-50 text-gray-800 focus:outline-none"
        />
      )} */}
      <p className="mt-4 text-center text-gray-700">
        Hiện tại tính năng đặt lịch ký gửi trên website đang tạm khoá.
        <br />
        Quý khách vui lòng gọi hotline{' '}
        <a href="tel:0703334443" className="text-blue-600 hover:underline">
          0703 334 443
        </a>{' '}
        để biết thêm thông tin.
        <br />
        Xin lỗi vì sự bất tiện này.
      </p>
      <button
        onClick={closeModal}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Đóng
      </button>
    </div>
  );

  const renderStringCodeBox = () => (
    <div className="p-6 bg-white rounded-xl max-w-lg w-full mx-4">
      <h3 className="text-xl font-bold mb-4">Hướng dẫn ký gửi online</h3>
      <p className="text-gray-700 mb-4">
        Sau khi truy cập Zalo, vui lòng nhấn **Quan tâm/Follow** để GAP có thể
        ghi nhận thông tin ký gửi từ anh/chị nhé!
      </p>
      <div className="my-10">
        <Image
          src={kyguiZalo}
          alt="QR Zalo Ký gửi"
          width={500}
          height={660}
          className="w-full max-w-xs mx-auto object-contain rounded-lg shadow-md"
        />
      </div>
      <button
        onClick={() => {
          if (isShowBookingOnline) {
            window.open(
              'https://zalo.me/1278273211257849348',
              '_blank',
              'noopener,noreferrer'
            );
          } else {
            openModal(renderBookingAlert());
          }
        }}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-700 transition font-medium"
      >
        Tiếp tục
      </button>
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-97px)] w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto h-full flex justify-center items-center relative w-full">
        {/* Menu chính - các text clickable */}
        {!isShowForm && (
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-10 text-center">
            <button
              onClick={() => handleOpenContent('consignment')}
              className={`
                text-[24px] sm:text-[30px] md:text-[35px] lg:text-[42px] font-medium text-black 
                opacity-0 -translate-x-36 transition-all duration-500 ease-out
                hover:-translate-y-3 hover:scale-105 active:scale-100
                ${isShowText ? 'opacity-100 translate-x-0' : ''}
              `}
            >
              Đặt Lịch
            </button>

            <button
              onClick={() => openModal(renderStringCodeBox())}
              className={`
                text-[24px] sm:text-[30px] md:text-[35px] lg:text-[42px] font-medium text-black 
                opacity-0 -translate-x-80 transition-all duration-500 ease-out
                hover:-translate-y-3 hover:scale-105 active:scale-100
                ${isShowText1 ? 'opacity-100 translate-x-0' : ''}
              `}
            >
              Ký Gửi Online
            </button>

            <button
              onClick={() => handleOpenContent('search')}
              className={`
                text-[24px] sm:text-[30px] md:text-[35px] lg:text-[42px] font-medium text-black 
                opacity-0 -translate-x-80 transition-all duration-500 ease-out
                hover:-translate-y-3 hover:scale-105 active:scale-100
                ${isShowText2 ? 'opacity-100 translate-x-0' : ''}
              `}
            >
              Xem Tổng Kết
            </button>

            <button
              onClick={() => handleOpenContent('instrument')}
              className={`
                text-[24px] sm:text-[30px] md:text-[35px] lg:text-[42px] font-medium text-black 
                opacity-0 -translate-x-80 transition-all duration-500 ease-out
                hover:-translate-y-3 hover:scale-105 active:scale-100
                ${isShowText3 ? 'opacity-100 translate-x-0' : ''}
              `}
            >
              Phương Thức Ký Gửi
            </button>
          </div>
        )}

        {/* Các form content */}
        <div
          className={`
            w-full
            transition-all duration-700 ease-in-out transform
            ${isShowForm && isShowBookingForm ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none absolute'}
          `}
        >
          {isShowForm && isShowBookingForm && (
            <BookingForm backConsignment={handleBackConsignment} />
          )}
        </div>

        <div
          className={`
            w-full
            transition-all duration-700 ease-in-out transform
            ${isShowForm && isShowSearchForm ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none absolute'}
          `}
        >
          {isShowForm && isShowSearchForm && (
            <SearchForm backConsignment={handleBackConsignment} />
          )}
        </div>

        <div
          className={`
            w-full
            transition-all duration-700 ease-in-out transform
            ${isShowForm && isShowInstrumentForm ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none absolute'}
          `}
        >
          {isShowForm && isShowInstrumentForm && (
            <InstrumentForm backConsignment={handleBackConsignment} />
          )}
        </div>
      </div>

      {/* Modal đơn giản thay MyModal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative bg-transparent"
            onClick={e => e.stopPropagation()}
          >
            {modalContent}
          </div>
        </div>
      )}
    </div>
  );
}
