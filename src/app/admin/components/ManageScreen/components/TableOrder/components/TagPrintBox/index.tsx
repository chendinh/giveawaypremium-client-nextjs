'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import ReceiptOffline from '../ReceiptOffline/index';

import './style.scss';

// ─── Types ────────────────────────────────────────────
interface ProductItem {
  name?: string;
  price?: number | string;
  count?: number;
}

interface TagPrintData {
  code?: string;
  objectIdOrder?: string;
  productList?: ProductItem[];
  totalNumberOfProductForSale?: number | string;
  totalMoneyForSale?: number | string;
}

interface TagPrintBoxProps {
  data: TagPrintData;
}

// ─── Component ────────────────────────────────────────
const TagPrintBox: React.FC<TagPrintBoxProps> = ({ data }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <div className="CodeBoxPinter">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full"
        onClick={() => handlePrint()}
      >
        <Printer className="h-3 w-3 mr-1" />
        In Bill
      </Button>
      <div style={{ display: 'none' }}>
        <ReceiptOffline data={data} ref={componentRef} />
      </div>
    </div>
  );
};

export default TagPrintBox;
