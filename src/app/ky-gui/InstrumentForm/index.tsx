'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import './style.scss';

// Helper function
const numberWithCommas = (x: number | string): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface InstrumentFormProps {
  backConsignment: () => void;
}

const InstrumentForm: React.FC<InstrumentFormProps> = ({ backConsignment }) => {
  // States
  const [isShowSectionOne, setIsShowSectionOne] = useState<boolean>(false);
  const [moneyBack, setMoneyBack] = useState<number | string>('');
  const [moneySold, setMoneySold] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSectionOne(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const changeData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value) || 0;

    setMoneySold(value);

    if (numValue > 0) {
      let calculatedMoneyBack = 0;

      if (numValue < 1000000) {
        calculatedMoneyBack = (numValue * 74) / 100;
      } else if (numValue >= 1000000 && numValue <= 10000000) {
        calculatedMoneyBack = (numValue * 77) / 100;
      } else if (numValue > 10000000) {
        calculatedMoneyBack = (numValue * 80) / 100;
      }

      setMoneyBack(calculatedMoneyBack);
    } else {
      setMoneyBack('');
    }
  };

  const backPageProps = () => {
    backConsignment();
  };

  return (
    <div className="instrument-container">
      <div className="home-page-wrapper">
        <div className="main-content-instrument radius-bottom">
          <div className="wrapper">
            <div
              className={
                'box-content-introduce' + (isShowSectionOne ? ' show' : '')
              }
            >
              <h2 className="text text-center text-color-0 txt-big-intro MB60 text-xl sm:text-2xl md:text-3xl font-bold">
                PHƯƠNG THỨC KÝ GỬI
              </h2>

              <div className="info-fee-box MB30">
                <div className="info-fee-box-left">
                  <h2
                    style={{ opacity: 0, pointerEvents: 'none' }}
                    className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base"
                  >
                    {'Danh mục'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'Dưới 1 triệu'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'Từ 1 đến 10 triệu'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'Trên 10 triệu'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro text-sm sm:text-base">
                    {'Luxury / chủ Brand'}
                  </h2>
                </div>

                <div className="info-fee-box-right">
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base font-semibold">
                    {'Phí Ký gửi:'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'26%'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'23%'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base">
                    {'20%'}
                  </h2>
                  <h2 className="text text-left text-color-10 txt-small-intro text-sm sm:text-base">
                    {'Thoả thuận'}
                  </h2>
                </div>
              </div>

              <div className="w-full sm:w-3/4 md:w-2/5 my-6 px-2 sm:px-0">
                <div className="relative">
                  <Input
                    value={moneySold}
                    type="number"
                    onChange={changeData}
                    placeholder="Nhập giá dự định ký gửi"
                    className="pr-12 text-base"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    vnđ
                  </span>
                </div>
              </div>

              <p className="MT10 text-sm sm:text-base px-2 sm:px-0">
                Số tiền sau khi đã trừ phí là:{' '}
                <span className="font-semibold">
                  {moneyBack ? numberWithCommas(moneyBack) : '---'}
                </span>
              </p>

              <Separator className="my-4 sm:my-6" />

              <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base px-2 sm:px-0">
                {'Thời gian ký gửi: Từ 50-70 ngày và tuỳ đợt ký gửi.'}
              </h2>

              <h2 className="text text-left text-color-10 txt-small-intro MB15 text-sm sm:text-base px-2 sm:px-0">
                {
                  'Quy định nhận ký gửi: Số lượng tối thiểu 5 món hoặc tuỳ giá trị đơn hàng (sản phẩm cao cấp).'
                }
              </h2>

              <h2 className="text text-left text-color-10 txt-small-intro MB15 whitespace-pre-line text-sm sm:text-base px-2 sm:px-0 leading-relaxed">
                {`*Tiêu chí ký gửi:
⁃ Giá ký gửi là giá thanh lý. Lấy sức hút, tình trạng của sản phẩm tại thời điểm bán để làm tiêu chuẩn định giá thanh lý. Dựa trên 3 yếu tố chính: chất liệu, kiểu dáng, thương hiệu. 
⁃ GAP chỉ nhận sản phẩm có thương hiệu (global/ local), authentic/ no fake, tình trạng mới từ 80%. 
⁃ Mỹ phẩm còn date từ 6 tháng (GAP sẽ giúp bạn check date). 
⁃ Không nhận: quần áo Quảng Châu, hàng không thương hiệu, hàng fake, mỹ phẩm hết date,…`}
              </h2>

              <h2 className="text text-left text-color-10 txt-small-intro MB15 whitespace-pre-line text-sm sm:text-base px-2 sm:px-0 leading-relaxed">
                {`*Lưu ý khác:
⁃ Sau khi được double check auth bởi CTV là chuyên viên đang làm việc tại Việt Nam và quốc tế, nếu phát hiện fake, GAP sẽ lưu kho và hoàn trả lại khi đến hẹn được ghi trên biên nhận ký gửi.
⁃ GAP.Q1 có hỗ trợ dịch vụ chuyển khoản tiền tất toán (có phí) và ship hàng tồn tận nhà cho khách (khách thanh toán phí ship).`}
              </h2>
            </div>

            <div className="flex justify-center mt-4 sm:mt-6 pb-4">
              <Button
                variant="secondary"
                onClick={backPageProps}
                className="min-w-[120px]"
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstrumentForm;
