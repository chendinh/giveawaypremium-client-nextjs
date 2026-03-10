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
}

// ─── Component ────────────────────────────────────────
const TagPrintBox: React.FC<TagPrintBoxProps> = ({ data }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <div className="flex flex-col">
      <span
        className="cursor-pointer inline-flex items-center text-muted-foreground hover:text-foreground"
        onClick={() => handlePrint()}
      >
        <Printer className="h-4 w-4" />
      </span>
      <TagQrcode data={data} ref={componentRef} />
    </div>
  );
};

export default TagPrintBox;
