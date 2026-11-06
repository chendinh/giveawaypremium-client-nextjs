'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { ReconTxStatus, TargetStatus } from '../types';

interface ReportSectionProps {
  id: string;
  title: string;
  description?: React.ReactNode;
  /** Nút thao tác — tự ẩn khi in */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  id,
  title,
  description,
  actions,
  className,
  children,
}) => (
  <section id={id} className={cn('scroll-mt-4', className)}>
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 print:hidden">{actions}</div>
      )}
    </div>
    {children}
  </section>
);

type AnyStatus = TargetStatus | ReconTxStatus;

const STATUS_STYLE: Record<AnyStatus, string> = {
  matched: 'border-green-200 bg-green-50 text-green-700',
  mismatch: 'border-amber-300 bg-amber-50 text-amber-800',
  missing: 'border-red-200 bg-red-50 text-red-700',
  unmatched: 'border-red-200 bg-red-50 text-red-700',
  explained: 'border-blue-200 bg-blue-50 text-blue-700',
};

const STATUS_LABEL: Record<AnyStatus, string> = {
  matched: 'Đã khớp',
  mismatch: 'Lệch tiền',
  missing: 'Chưa thấy tiền',
  unmatched: 'Chưa khớp',
  explained: 'Đã giải trình',
};

export const StatusBadge: React.FC<{ status: AnyStatus }> = ({ status }) => (
  <Badge
    variant="outline"
    className={cn('whitespace-nowrap font-medium', STATUS_STYLE[status])}
  >
    {STATUS_LABEL[status]}
  </Badge>
);
