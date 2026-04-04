'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import GapService from '@/app/actions/GapServices';

// ─── Types ────────────────────────────────────────────
interface BillOrderViettelPostProps {
  orderNumber: string;
}

// ─── Component ────────────────────────────────────────
const BillOrderViettelPost: React.FC<BillOrderViettelPostProps> = ({
  orderNumber,
}) => {
  const [base64, setBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLabel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GapService.getViettelPostLabel(orderNumber);

      if (response?.success && response.pdfBase64) {
        setBase64(response.pdfBase64);
      } else {
        toast.error(response?.error || 'Không thể tải nhãn đơn hàng Viettel Post');
      }
    } catch (error) {
      console.error('Error fetching Viettel Post label:', error);
      toast.error('Không thể tải nhãn đơn hàng Viettel Post');
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setBase64(null);
    toast.loading('Đang tải lại...', { id: 'bill-viettel-loading' });
    fetchLabel().then(() => toast.dismiss('bill-viettel-loading'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Nhãn Viettel Post</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      ) : base64 ? (
        <div className="mt-4 border rounded-md overflow-hidden">
          <embed
            type="application/pdf"
            width="100%"
            height="400"
            src={`data:application/pdf;base64,${base64}`}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          Chưa có dữ liệu nhãn vận chuyển
        </p>
      )}
    </div>
  );
};

export default BillOrderViettelPost;
