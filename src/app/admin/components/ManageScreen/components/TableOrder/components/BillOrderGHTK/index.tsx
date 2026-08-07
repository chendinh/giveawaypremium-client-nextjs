'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import GapService from '@/app/actions/GapServices';

interface BillOrderGHTKProps {
  orderId: string;
}

const VTP_PROXY_BASE =
  (process.env.NEXT_PUBLIC_SERVER_URL?.replace('/parse', '') || '') +
  '/hooks/vtp-label';

const BillOrderGHTK: React.FC<BillOrderGHTKProps> = ({ orderId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<'A5' | 'A6' | null>(null);

  const handleFetchLabel = async (pageSize: 'A5' | 'A6') => {
    setIsLoading(true);
    setLabelUrl(null);
    setActiveSize(null);
    try {
      const res = await GapService.getLabelTransform(
        orderId,
        'portrait',
        pageSize
      );
      // Parse Cloud Function bao thành { result: "https://..." }
      const url = res?.result;
      if (url && typeof url === 'string' && url.startsWith('http')) {
        setLabelUrl(url);
        setActiveSize(pageSize);
      } else {
        toast.error('Không lấy được link in vận đơn');
      }
    } catch {
      toast.error('Lỗi khi lấy nhãn vận đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Proxy qua NestJS để tránh CORS/X-Frame của VTP
  const proxyUrl = labelUrl
    ? `${VTP_PROXY_BASE}?url=${encodeURIComponent(labelUrl)}`
    : null;

  return (
    <div className="space-y-3">
      {/* Nút chọn cỡ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={activeSize === 'A5' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFetchLabel('A5')}
          disabled={isLoading}
        >
          {isLoading && activeSize !== 'A6' ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Printer className="h-3 w-3 mr-1" />
          )}
          A5
        </Button>
        <Button
          variant={activeSize === 'A6' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFetchLabel('A6')}
          disabled={isLoading}
        >
          {isLoading && activeSize !== 'A5' ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Printer className="h-3 w-3 mr-1" />
          )}
          A6
        </Button>

        {labelUrl && (
          <>
            <a
              href={labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Mở tab mới
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleFetchLabel(activeSize!)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tải lại
            </Button>
          </>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded border border-dashed">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Nhãn embed qua proxy — VTP HTML với base tag để assets load đúng */}
      {proxyUrl && !isLoading && (
        <iframe
          src={proxyUrl}
          className="w-full rounded border bg-white"
          style={{ height: 500 }}
          title="Nhãn vận đơn ViettelPost"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

export default BillOrderGHTK;
