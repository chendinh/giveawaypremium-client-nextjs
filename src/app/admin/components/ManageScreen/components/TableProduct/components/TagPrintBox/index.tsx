'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import TagQrcode from '../TagQrcode';

// ─── Types ────────────────────────────────────────────
interface TagPrintBoxData {
  code?: string;
  name?: string;
  price?: number;
  isNew?: string;
  rateNew?: number;
}

interface TagPrintBoxProps {
  data: TagPrintBoxData;
  /** Số lượng nhãn muốn in — mặc định 1 */
  printCount?: number;
}

// ─── Component ────────────────────────────────────────
const TagPrintBox: React.FC<TagPrintBoxProps> = ({ data, printCount = 1 }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const count = Math.max(1, printCount);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  return (
    <div className="flex flex-col">
      {/* Nút in */}
      <span
        className="cursor-pointer inline-flex items-center text-muted-foreground hover:text-foreground"
        onClick={() => handlePrint()}
      >
        <Printer className="h-4 w-4" />
      </span>

      {/*
        Vùng được print — luôn render trong DOM để react-to-print đọc được.
        Khi count = 1: hiển thị 1 TagQrcode (y hệt code gốc).
        Khi count > 1: hiển thị nhiều TagQrcode xếp ngang trong 1 flex container.
        Trên màn hình luôn thấy QR preview (TagQrcode đầu tiên).
      */}
      <div ref={printRef}>
        {count === 1 ? (
          <TagQrcode data={data} />
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '270px',
            }}
          >
            {Array.from({ length: count }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  display: 'inline-block',
                  width: '34mm',
                  margin: 0,
                  marginLeft: 2.5,
                }}
              >
                <TagQrcode data={data} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPrintBox;
