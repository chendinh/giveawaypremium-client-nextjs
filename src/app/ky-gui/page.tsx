'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import BookingForm from './BookingForm';
import InstrumentForm from './InstrumentForm';
import SearchForm from './SearchForm';

import kyguiZalo from '@images/kyguiquantam.jpg';

type ActiveTab = 'menu' | 'consignment' | 'search' | 'instrument';

interface BookingAlertModalProps {
  onClose: () => void;
}

interface ZaloModalProps {
  isShowBookingOnline: boolean;
  onClose: () => void;
  onOpenBookingAlert: () => void;
}

function BookingAlertModal({ onClose }: BookingAlertModalProps) {
  return (
    <div className="p-6 bg-white rounded-xl max-w-lg w-full mx-4">
      <h3 className="text-xl font-bold mb-4 text-center">Thông báo</h3>
      <p className="mt-4 text-center text-gray-700">
        Hiện tại tính năng đặt lịch ký gửi trên website đang tạm khoá.
        <br />
        Quý khách vui lòng gọi hotline{' '}
        <a href="tel:0703334443" className="text-blue-600 hover:underline">
          0703 334 443
        </a>{' '}
        để được hướng dẫn phương thức kí gửi khác
        <br />
        Xin lỗi vì sự bất tiện này.
      </p>
      <button
        onClick={onClose}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Đóng
      </button>
    </div>
  );
}

function ZaloModal({
  isShowBookingOnline,
  onClose,
  // _onOpenBookingAlert không còn dùng — dead-end đã được xử lý inline
  onOpenBookingAlert: _onOpenBookingAlert,
}: ZaloModalProps) {
  // Tính năng tắt → hiển thị hotline ngay, không mở modal thứ 2
  if (!isShowBookingOnline) {
    return (
      <div className="p-6 bg-white rounded-xl max-w-md w-full mx-auto text-center space-y-4">
        <h3 className="text-xl font-bold">Ký Gửi Online</h3>
        <p className="text-gray-600">
          Tính năng đang tạm ngưng. Để ký gửi, vui lòng liên hệ trực tiếp:
        </p>
        <a
          href="tel:0703334443"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-gray-800 transition"
        >
          📞 0703 334 443
        </a>
        <p className="text-xs text-gray-400">
          Hoặc nhắn tin Zalo cùng số trên để được hỗ trợ nhanh nhất.
        </p>
        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl max-w-md w-full mx-auto">
      <h3 className="text-xl font-bold mb-4">Hướng dẫn ký gửi online</h3>
      <p className="text-gray-700 mb-4">
        Sau khi truy cập Zalo, vui lòng nhấn <strong>Quan tâm/Follow</strong> để
        GAP có thể ghi nhận thông tin ký gửi từ anh/chị nhé!
      </p>
      <div className="my-10">
        <Image
          src={kyguiZalo}
          alt="QR Zalo Ký gửi"
          width={320}
          height={159}
          placeholder="blur"
          className="w-full max-w-xs mx-auto object-contain rounded-lg shadow-md"
        />
      </div>
      <button
        onClick={() =>
          window.open(
            'https://zalo.me/1278273211257849348',
            '_blank',
            'noopener,noreferrer'
          )
        }
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-700 transition font-medium"
      >
        Mở Zalo
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full text-gray-400 py-2 text-sm hover:text-gray-700 transition"
      >
        Đóng
      </button>
    </div>
  );
}

type ModalType = 'zalo' | null;

export default function ConsignmentPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('menu');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [isShowBookingOnline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsMenuVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenTab = (tab: Exclude<ActiveTab, 'menu'>) => {
    setIsMenuVisible(false);
    setTimeout(() => setActiveTab(tab), 500);
  };

  const handleBackToMenu = () => {
    setActiveTab('menu');
    setIsMenuVisible(true);
  };

  const closeModal = () => setModal(null);

  const menuItems: { label: string; action: () => void; offset: string }[] = [
    {
      label: 'Đặt Lịch',
      action: () => handleOpenTab('consignment'),
      offset: '-translate-x-36',
    },
    {
      label: 'Ký Gửi Online',
      action: () => setModal('zalo'),
      offset: '-translate-x-80',
    },
    {
      label: 'Xem Tổng Kết',
      action: () => handleOpenTab('search'),
      offset: '-translate-x-80',
    },
    {
      label: 'Phương Thức Ký Gửi',
      action: () => handleOpenTab('instrument'),
      offset: '-translate-x-80',
    },
  ];

  return (
    <div className="h-[calc(90vh-120px)] pt-[190px] sm:pt-16 scroll-m-0 sm:h-full sm:min-h-screen w-screen px-4 sm:px-6 lg:px-8">
      <div className="mx-auto h-full flex justify-center items-center relative w-full">
        {/* Menu chính */}
        {activeTab === 'menu' && (
          <div className="flex flex-col items-center justify-center space-y-10 text-center">
            {menuItems.map(({ label, action, offset }) => (
              <button
                key={label}
                onClick={action}
                className={cn(
                  'text-[30px] md:text-[35px] lg:text-[42px] font-medium text-black',
                  'opacity-0 transition-all duration-500 ease-out',
                  'hover:-translate-y-3 hover:scale-105 active:scale-100',
                  offset,
                  isMenuVisible && 'opacity-100 translate-x-0'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Form content */}
        <div
          className={cn(
            'w-full transition-all duration-700 ease-in-out transform',
            activeTab === 'consignment'
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-full pointer-events-none absolute'
          )}
        >
          {activeTab === 'consignment' && (
            <BookingForm backConsignment={handleBackToMenu} />
          )}
        </div>

        <div
          className={cn(
            'w-full transition-all duration-700 ease-in-out transform',
            activeTab === 'search'
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-full pointer-events-none absolute'
          )}
        >
          {activeTab === 'search' && (
            <SearchForm backConsignment={handleBackToMenu} />
          )}
        </div>

        <div
          className={cn(
            'w-full transition-all duration-700 ease-in-out transform',
            activeTab === 'instrument'
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-full pointer-events-none absolute'
          )}
        >
          {activeTab === 'instrument' && (
            <InstrumentForm backConsignment={handleBackToMenu} />
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative bg-transparent"
            onClick={e => e.stopPropagation()}
          >
            {modal === 'zalo' && (
              <ZaloModal
                isShowBookingOnline={isShowBookingOnline}
                onClose={closeModal}
                onOpenBookingAlert={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
