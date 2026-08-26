'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import TagQrcode from '../TagQrcode';
import './style.scss';

// ─── Types ────────────────────────────────────────────
interface ProductDataItem {
  code?: string;
  name?: string;
  price?: number;
  isNew?: string;
  rateNew?: number;
  numberTagCount: number;
}

interface TagPrintBoxMultiProps {
  productData: ProductDataItem[];
}

// ─── Component ────────────────────────────────────────
const TagPrintBoxMulti: React.FC<TagPrintBoxMultiProps> = ({ productData }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Expand productData by numberTagCount for batch printing
  // numberTagCount ở đây đã được override bởi nhân viên (hoặc fallback về tồn kho)
  const productDataExpanded: ProductDataItem[] = [];
  for (const detail of productData) {
    const count = Math.max(0, detail.numberTagCount);
    for (let i = 0; i < count; i++) {
      productDataExpanded.push(detail);
    }
  }

  return (
    <div className="CodeBoxPinterMulti">
      <span
        className="inline-flex items-center gap-2 cursor-pointer border border-border px-3 py-2 rounded-full text-sm hover:bg-accent transition-colors"
        onClick={() => handlePrint()}
      >
        <Printer className="h-5 w-5" />
        In Ngay
      </span>
      <div className="boxTwoTag" ref={componentRef}>
        {productDataExpanded.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'inline-block',
              width: '34mm',
              margin: 0,
              marginLeft: 2.5,
            }}
          >
            <TagQrcode data={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagPrintBoxMulti;
