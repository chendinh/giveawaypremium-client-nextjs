'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Printer, RefreshCw } from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';

import CashflowSection from './components/CashflowSection';
import DirectorReport from './components/DirectorReport';
import EvidenceSection from './components/EvidenceSection';
import ExpensesDialog from './components/ExpensesDialog';
import HoldingCard from './components/HoldingCard';
import OrdersSection from './components/OrdersSection';
import PayoutsSection from './components/PayoutsSection';
import ReconciliationSection from './components/ReconciliationSection';
import SummarySection from './components/SummarySection';
import {
  buildMonthOptions,
  currentVnMonth,
  formatDate,
  formatDateTime,
  monthLabel,
  shiftMonth,
} from './format';
import { MonthlyExpenses, MonthlyReport, ReportAttachment } from './types';
import { useHasHydrated } from './useHasHydrated';

type TabKey = 'director' | 'detail';

/** Mã lỗi Parse: session token không hợp lệ / hết hạn */
const INVALID_SESSION_CODE = 209;

/** Khổ A4 ngang cho bảng nhiều cột; ẩn các phần chỉ có ý nghĩa trên màn hình. */
const PRINT_CSS = `
@page { size: A4 landscape; margin: 10mm; }
@media print {
  html, body { background: #fff !important; }
  #parallax, [data-sonner-toaster] { display: none !important; }
  .report-root { padding: 0 !important; }
  table { font-size: 10px; }
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tr, figure { break-inside: avoid; }
}
`;

const DETAIL_SECTION_LINKS = [
  { href: '#tong-quan', label: 'Tổng quan' },
  { href: '#chi-tiet-don', label: 'Chi tiết đơn' },
  { href: '#tra-khach', label: 'Trả khách' },
  { href: '#doi-chieu', label: 'Đối chiếu ngân hàng' },
  { href: '#chung-tu', label: 'Chứng từ' },
];

const describeError = (res: any): string => {
  if (!res) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  if (res.code === INVALID_SESSION_CODE) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại ở trang quản trị.';
  }
  return res.error || 'Không tải được báo cáo. Vui lòng thử lại.';
};

const LoginRequired: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-white p-4">
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4 p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold">Báo cáo kiểm kê</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Trang này chỉ dành cho tài khoản quản trị. Vui lòng đăng nhập ở
            trang quản trị rồi mở lại mục “Báo cáo”.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">Đến trang đăng nhập</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

const MonthlyReportPage: React.FC = () => {
  const { userData, isAuthenticated } = useAppStore();
  const hasHydrated = useHasHydrated();

  const [month, setMonth] = useState<string>(() =>
    shiftMonth(currentVnMonth(), 1)
  );
  const [activeTab, setActiveTab] = useState<TabKey>('director');
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expensesDialogOpen, setExpensesDialogOpen] = useState(false);

  const requestRef = useRef(0);
  const attachmentsRequestRef = useRef(0);

  const isLoggedIn = !!(userData?.sessionToken || isAuthenticated);

  const loadReport = useCallback(async (target: string, refresh = false) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    const res = await GapService.getMonthlyReport(target, refresh);
    if (requestId !== requestRef.current) return; // người dùng đã đổi tháng

    if (res?.result) {
      setReport(res.result as MonthlyReport);
    } else {
      setError(describeError(res));
    }
    setLoading(false);
  }, []);

  const loadAttachments = useCallback(async (target: string) => {
    const requestId = ++attachmentsRequestRef.current;
    setLoadingAttachments(true);
    const res = await GapService.listReportAttachments(target);
    if (requestId !== attachmentsRequestRef.current) return;
    setAttachments(Array.isArray(res?.result) ? res.result : []);
    setLoadingAttachments(false);
  }, []);

  // Tải báo cáo mỗi khi đăng nhập xong hoặc đổi tháng. Không xoá `report` cũ
  // trước khi tải — giữ số liệu tháng trước hiển thị kèm overlay loading, tránh
  // màn hình trắng; requestRef ở trên đã chặn kết quả trả về trễ ghi đè nhầm.
  useEffect(() => {
    if (!hasHydrated || !isLoggedIn) return;
    loadReport(month);
    loadAttachments(month);
  }, [hasHydrated, isLoggedIn, month, loadReport, loadAttachments]);

  const handlePrint = () => {
    // Trình duyệt dùng title làm tên file khi "Lưu thành PDF"
    const previousTitle = document.title;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restore);
    };
    document.title = `Bao-cao-kiem-ke-${month}`;
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const handleExpensesSaved = (updated: MonthlyExpenses) => {
    setExpensesDialogOpen(false);
    setReport(prev =>
      prev
        ? {
            ...prev,
            expenses: updated,
            profit: {
              feeVnd: prev.profit.feeVnd,
              expensesVnd: updated.totalVnd,
              netVnd: prev.profit.feeVnd - updated.totalVnd,
            },
          }
        : prev
    );
  };

  if (!hasHydrated) return <div className="min-h-screen bg-white" />;
  if (!isLoggedIn) return <LoginRequired />;

  const periodEnd = report
    ? formatDate(new Date(new Date(report.to).getTime() - 1).toISOString())
    : '';

  return (
    <div className="report-root min-h-screen w-full bg-white text-gray-900">
      <style>{PRINT_CSS}</style>

      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-8">
        {/* Thanh điều khiển — không in */}
        <div className="space-y-3 print:hidden">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang quản trị
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Báo cáo kiểm kê</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildMonthOptions(24).map(option => (
                    <SelectItem key={option} value={option}>
                      {monthLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                title="Tính lại từ dữ liệu gốc, bỏ qua bản đã lưu của tháng cũ"
                onClick={() => {
                  loadReport(month, true);
                  loadAttachments(month);
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Tải lại
              </Button>
              <Button onClick={handlePrint} disabled={!report}>
                <Printer className="h-4 w-4" /> In / Lưu PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Đầu trang khi in */}
        <div className="hidden border-b pb-3 print:block">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            GiveAway Premium
          </p>
          <h1 className="text-2xl font-bold">
            {activeTab === 'director'
              ? 'Báo cáo kiểm kê'
              : 'Chi tiết & đối chiếu'}{' '}
            {monthLabel(month).toLowerCase()}
          </h1>
        </div>

        {report && (
          <p className="-mt-2 text-sm text-muted-foreground">
            Kỳ báo cáo {formatDate(report.from)} – {periodEnd} (giờ Việt Nam) ·
            Lập bởi {report.generatedBy || '—'} lúc{' '}
            {formatDateTime(report.generatedAt)}
            {report.cache?.source === 'snapshot' && report.cache.savedAt && (
              <span className="print:hidden">
                {' '}
                · Số liệu đã lưu sẵn, không tính lại (bấm “Tải lại” nếu dữ liệu
                gốc đã đổi)
              </span>
            )}
          </p>
        )}

        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-red-800">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() => loadReport(month)}
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && !report && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {report && (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as TabKey)}
          >
            <TabsList className="print:hidden">
              <TabsTrigger value="director">Báo cáo giám đốc</TabsTrigger>
              <TabsTrigger value="detail">Chi tiết & đối chiếu</TabsTrigger>
            </TabsList>

            <TabsContent value="director" className="space-y-6">
              <DirectorReport
                report={report}
                onEditExpenses={() => setExpensesDialogOpen(true)}
                onViewDetail={() => setActiveTab('detail')}
              />
            </TabsContent>

            <TabsContent value="detail" className="space-y-8">
              <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm print:hidden">
                {DETAIL_SECTION_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-blue-700 hover:underline"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <SummarySection report={report} />
              <div className="max-w-md">
                <HoldingCard holding={report.holding} />
              </div>
              <OrdersSection orders={report.orders} />
              <PayoutsSection
                rows={report.payouts.rows}
                summary={report.payouts.summary}
              />
              <ReconciliationSection
                report={report}
                onChanged={() => loadReport(month)}
              />
              <EvidenceSection
                month={month}
                attachments={attachments}
                loading={loadingAttachments}
                onChanged={() => loadAttachments(month)}
              />
            </TabsContent>
          </Tabs>
        )}

        <CashflowSection />
      </div>

      {expensesDialogOpen && report && (
        <ExpensesDialog
          key={report.month}
          month={report.month}
          expenses={report.expenses}
          onSaved={handleExpensesSaved}
          onClose={() => setExpensesDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default MonthlyReportPage;
