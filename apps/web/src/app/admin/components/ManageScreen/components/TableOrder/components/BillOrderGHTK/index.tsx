'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import GapService from '@/app/actions/GapServices';

// ─── Types ────────────────────────────────────────────
interface BillOrderGHTKProps {
  orderId: string;
}

// ─── Component ────────────────────────────────────────
const BillOrderGHTK: React.FC<BillOrderGHTKProps> = ({ orderId }) => {
  const [base64, setBase64] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'A6' | 'A5'>('A6');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchDefaultLabel = useCallback(
    async (
      orientationProp: 'portrait' | 'landscape' = orientation,
      pageSizeProp: 'A6' | 'A5' = pageSize
    ) => {
      setIsLoading(true);
      try {
        const labelBase64 = await GapService.getLabelTransform(
          orderId,
          orientationProp,
          pageSizeProp
        );
        if (labelBase64?.result) {
          setBase64(labelBase64.result);
        }
      } catch {
        toast.error('Không thể tải nhãn đơn hàng');
      } finally {
        setIsLoading(false);
      }
    },
    [orderId, orientation, pageSize]
  );

  useEffect(() => {
    fetchDefaultLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOrientation = () => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    setBase64(null);
    toast.loading('Đang load lại', { id: 'bill-ghtk-loading' });
    fetchDefaultLabel(newOrientation, pageSize).then(() =>
      toast.dismiss('bill-ghtk-loading')
    );
  };

  const updatePageSize = () => {
    const newPageSize = pageSize === 'A6' ? 'A5' : 'A6';
    setPageSize(newPageSize);
    setBase64(null);
    toast.loading('Đang load lại', { id: 'bill-ghtk-loading' });
    fetchDefaultLabel(orientation, newPageSize).then(() =>
      toast.dismiss('bill-ghtk-loading')
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm capitalize">
          {orientation} - {pageSize}
        </span>
        <Button variant="outline" size="sm" onClick={updateOrientation}>
          <RotateCw className="h-3 w-3 mr-1" />
          {orientation === 'portrait' ? 'Landscape' : 'Portrait'}
        </Button>
        <Button variant="outline" size="sm" onClick={updatePageSize}>
          {pageSize === 'A6' ? 'A5' : 'A6'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      ) : base64 ? (
        <div className="mt-4">
          <embed
            type="application/pdf"
            width="100%"
            height="400"
            src={`data:application/pdf;base64,${base64}`}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      )}
    </div>
  );
};

export default BillOrderGHTK;
