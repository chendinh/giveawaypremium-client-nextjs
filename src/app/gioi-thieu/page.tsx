// app/about/page.tsx
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { MapPinCheckIcon, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timeline } from 'antd';
import ImageGallery from 'react-image-gallery';
import './gioi-thieu.scss';

const Items = Timeline.Item;

const photoItems = [
  { src: '../../images/Icon/aLogoBlack.svg', alt: 'Logo' },
  { src: '../../images/Store/store1.jpg', alt: 'Store 1' },
  { src: '../../images/Store/store2.jpg', alt: 'Store 2' },
  { src: '../../images/Store/store3.jpg', alt: 'Store 3' },
  { src: '../../images/Store/store4.jpg', alt: 'Store 4' },
  { src: '../../images/Store/store5.jpg', alt: 'Store 5' },
  { src: '../../images/Store/store6.jpg', alt: 'Store 6' },
  { src: '../../images/Store/store7.jpg', alt: 'Store 7' },
  { src: '../../images/Store/store8.jpg', alt: 'Store 8' },
  { src: '../../images/Store/store9.jpg', alt: 'Store 9' },
  { src: '../../images/Store/store12.jpg', alt: 'Store 12' },
  { src: '../../images/Store/store13.jpg', alt: 'Store 13' },
  { src: '../../images/Store/store14.jpg', alt: 'Store 14' },
  { src: '../../images/Store/store15.jpg', alt: 'Store 15' },
  { src: '../../images/Store/store16.jpg', alt: 'Store 16' },
  { src: '../../images/Store/store17.jpg', alt: 'Store 17' },
  { src: '../../images/Store/store18.jpg', alt: 'Store 18' },
  { src: '../../images/Store/store19.jpg', alt: 'Store 19' },
  { src: '../../images/Store/store20.jpg', alt: 'Store 20' },
  { src: '../../images/Store/store21.jpg', alt: 'Store 21' },
  { src: '../../images/Store/store22.jpg', alt: 'Store 22' },
  { src: '../../images/Store/store23.jpg', alt: 'Store 23' },
  { src: '../../images/Store/store24.jpg', alt: 'Store 24' },
  { src: '../../images/Store/store26.jpg', alt: 'Store 26' },
  { src: '../../images/Store/store27.jpg', alt: 'Store 27' },
  { src: '../../images/Store/store28.jpg', alt: 'Store 28' },
  { src: '../../images/Store/store29.jpg', alt: 'Store 29' },
] as const;

const imagesPhoto = [
  {
    original: photoItems[0].src,
    thumbnail: photoItems[0].src,
  },
  {
    original: photoItems[1].src,
    thumbnail: photoItems[1].src,
  },
  {
    original: photoItems[2].src,
    thumbnail: photoItems[2].src,
  },
  {
    original: photoItems[3].src,
    thumbnail: photoItems[3].src,
  },
  {
    original: photoItems[4].src,
    thumbnail: photoItems[4].src,
  },
  {
    original: photoItems[5].src,
    thumbnail: photoItems[5].src,
  },
  {
    original: photoItems[6].src,
    thumbnail: photoItems[6].src,
  },
  {
    original: photoItems[7].src,
    thumbnail: photoItems[7].src,
  },
  {
    original: photoItems[8].src,
    thumbnail: photoItems[8].src,
  },
  {
    original: photoItems[9].src,
    thumbnail: photoItems[9].src,
  },
  {
    original: photoItems[10].src,
    thumbnail: photoItems[10].src,
  },
  {
    original: photoItems[11].src,
    thumbnail: photoItems[11].src,
  },
  {
    original: photoItems[12].src,
    thumbnail: photoItems[12].src,
  },
  {
    original: photoItems[13].src,
    thumbnail: photoItems[13].src,
  },
  {
    original: photoItems[14].src,
    thumbnail: photoItems[14].src,
  },
  {
    original: photoItems[15].src,
    thumbnail: photoItems[15].src,
  },
  {
    original: photoItems[16].src,
    thumbnail: photoItems[16].src,
  },
  {
    original: photoItems[17].src,
    thumbnail: photoItems[17].src,
  },
  {
    original: photoItems[18].src,
    thumbnail: photoItems[18].src,
  },
  {
    original: photoItems[19].src,
    thumbnail: photoItems[19].src,
  },
  {
    original: photoItems[20].src,
    thumbnail: photoItems[20].src,
  },
  {
    original: photoItems[21].src,
    thumbnail: photoItems[21].src,
  },
  {
    original: photoItems[22].src,
    thumbnail: photoItems[22].src,
  },
  {
    original: photoItems[23].src,
    thumbnail: photoItems[23].src,
  },
  {
    original: photoItems[24].src,
    thumbnail: photoItems[24].src,
  },
  {
    original: photoItems[25].src,
    thumbnail: photoItems[25].src,
  },
  {
    original: photoItems[26].src,
    thumbnail: photoItems[26].src,
  },
];

export default function AboutUsPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShow(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen mx-auto gioi-thieu-page">
      {/* Phần giới thiệu chính - tương ứng .box-content-introduce */}
      <section className="py-16 md:py-24 ">
        <div className="mx-auto px-5">
          <div
            className={cn(
              'text-center opacity-0 translate-x-[-150px] transition-all duration-1000 ease-in-out',
              { 'opacity-100 translate-x-0': isShow }
            )}
          >
            <h1 className="text-[8vw] mt-10 md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight whitespace-pre-line">
              Give Away
            </h1>
            <p className="text-base text-left md:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              Thời trang bền vững là một khái niệm vĩ mô trong những lần đầu bạn
              nghe đến, thế nhưng trong vai trò một khách hàng thông minh, chúng
              ta có rất nhiều cách đơn giản nhằm hưởng ứng tinh thần từ chủ
              nghĩa tái sử dụng. Thời trang bền vững - thương hiệu sẽ tập trung
              vào việc mang đến các sản phẩm sử dụng chất liệu xanh, chất liệu
              hữu cơ hay tái chế, hoặc cắt giảm những chất thải phát sinh trong
              quá trình sản xuất và vận chuyển. Việc tái sử dụng thì khác - tập
              trung kéo dài tuổi thọ của vật chất, sản phẩm. Nhằm loại bỏ mọi
              tác động tiêu cực đến môi trường.
            </p>
            <p className="text-base text-left md:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8 whitespace-pre-line">
              {`Đến thời điểm hiện tại, chuỗi Give Away đã có mặt tại Quận 1, Quận 3, Quận 10, Quận 7, Bình Thạnh, Gò Vấp, Tân Phú, Thủ Đức và các tỉnh thành khác như Biên Hoà, Bình Dương, Đà Nẵng.\n
              Give Away có ba phân khúc chính:\n
              - Give Away dành cho Học Sinh Sinh Viên\n
              - Give Away Kid dành cho Mẹ và Bé\n
              - Give Away Premium chuyên thanh lý sản phẩm cao cấp, chính hãng`}
            </p>
            <p className="text-base text-left md:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Là cộng đồng tái sử dụng đầu tiên và lớn nhất Việt Nam với hơn một
              triệu người dùng - Give Away giúp các sản phẩm thanh lý nhanh
              chóng tìm được chủ mới phù hợp. Chính sách ký gửi rõ ràng và uy
              tín, đã đến lúc giải phóng tủ đồ của bạn. Tạo dòng tiền quay trở
              lại từ việc mua sắm bằng cách tham gia Give Away ngay hôm nay.
            </p>
          </div>
        </div>
      </section>

      {/* Phần Founder - .bg-black + .show */}
      <section
        className={cn(
          'bg-black w-[100vw] mb-4 text-white py-2 transition-all duration-1000 ease-in-out opacity-0',
          {
            'opacity-100': isShow,
          }
        )}
      >
        <div className="w-full mx-auto  text-center flex flex-col items-center justify-center min-h-[50vh] md:min-h-[100vh]">
          <span className="text-base lg:text-xl mb-10 whitespace-pre-line">
            {
              'Founder Give Away Lê Diệp Hồng Loan \n đã lan toả ý tưởng từ năm 2013'
            }
          </span>
          <div className="relative w-[65%] md:w-[45%] h-auto aspect-square border-gray-700 shadow-2xl">
            <Image
              src="/images/founder-avater.jpg"
              alt="Founder Lê Diệp Hồng Loan"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <div className="bg-white PT40">
        <div className="main-content full-height">
          <div className="wrapper flex align-center direction-column justify-between">
            <Timeline className="" mode="alternate">
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2013
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline">
                  Hoạt động mô hình ký gửi sản phẩm thời trang cũ dưới danh
                  nghĩa cá nhân. Với mong muốn tái sử dụng thời trang cùng các
                  bạn nữ trẻ, truyền tải xu hướng sống và tiết kiệm
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2014
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline ">
                  Cửa hàng Give Away đầu tiên ra đời
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2015
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline ">
                  Give Away mở rộng chuỗi cửa hàng. Phân khúc chính học sinh
                  sinh viên
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2016
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline ">
                  Give Away mở rộng phân khúc tái sử dụng thời trang cao cấp,
                  ngoài nhận ký gửi từ cá nhân, chuỗi còn giải quyết tồn kho/
                  hàng lỗi từ các trung tâm thương mại, nhà sản xuất, nhà thiết
                  kế thời trang...
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2017
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline ">
                  Give Away mở rộng phân khúc tái sử dụng thời trang trẻ em
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="ext text-center text-2xl text-semibold text-black">
                  2018
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline">
                  Cập nhật công nghệ chiếu tia UV tiệt trùng cho các áo quần đã
                  qua sử dụng
                </span>
              </Items>
              <Items color={'black'} style={{ minHeight: '100px' }}>
                <span className="text text-center text-2xl text-semibold text-black">
                  2019
                </span>
                <br />
                <span className="text text-center text-gray-700 text-timeline ">
                  Mở rộng phân khúc Luxury - hàng hiệu cao cấp. Cập nhật công
                  nghệ Entrupy - ứng dụng trí tuệ nhân tạo phân biệt hàng giả.
                  Đồng thời cập nhật dịch vụ vệ sinh túi xách
                </span>
              </Items>
            </Timeline>
            {/* <img src={images.timeLine} className='time-line' /> */}
          </div>
        </div>
      </div>

      <div className={'bg-black'}>
        <div className="main-content w-[100vw] full-height">
          <div className="flex align-center flex-col items-center justify-between">
            <ImageGallery
              autoPlay
              style={{ width: '96vw' }}
              items={imagesPhoto}
            />
          </div>
        </div>
      </div>

      <div className="footer-aboutus">
        <div className="flex mb-[20px]">
          <Image
            alt="marker"
            width={15}
            height={20}
            objectFit="contain"
            src={'/images/Icon/marker.png'}
            className="icon-footer mr-[10px]"
          />
          <span>
            {`1 Phó Đức Chính, Phường Nguyễn Thái Bình, Quận 1, Hồ Chí Minh. \n( Ngoài ra chúng tôi còn có chi nhánh ở Phú Nhuận )`}
          </span>
        </div>

        <div className="flex mb-[10px]">
          <Image
            alt="phone"
            width={18}
            height={20}
            objectFit="contain"
            src={'/images/Icon/phone.png'}
            className="icon-footer mr-[10px] h-[20px]"
          />
          <a href="tel:0703334443" className="hover:text-gray-500">
            0703334443
          </a>
        </div>

        <div className="line-footer" />
      </div>
    </div>
  );
}
