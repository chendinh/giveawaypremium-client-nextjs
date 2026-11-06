'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  FloatButton,
  Result,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
} from 'antd';
import viVN from 'antd/locale/vi_VN';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  RefreshCw,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

import { buildBankLookup } from './components/BankCheckCell';
import CashflowSection from './components/CashflowSection';
import DirectorReport from './components/DirectorReport';
import EvidenceSection from './components/EvidenceSection';
import ExpensesDialog from './components/ExpensesDialog';
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
import {
  MonthlyExpenses,
  MonthlyReport,
  ReconPayoutItem,
  ReportAttachment,
} from './types';
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
  { key: 'tong-quan', href: '#tong-quan', title: 'Tổng quan' },
  { key: 'chi-tiet-don', href: '#chi-tiet-don', title: 'Chi tiết đơn' },
  { key: 'tra-khach', href: '#tra-khach', title: 'Trả khách' },
  { key: 'doi-chieu', href: '#doi-chieu', title: 'Đối chiếu ngân hàng' },
  { key: 'chung-tu', href: '#chung-tu', title: 'Chứng từ' },
];

const MONTH_OPTIONS_COUNT = 24;

const describeError = (res: any): string => {
  if (!res) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  if (res.code === INVALID_SESSION_CODE) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại ở trang quản trị.';
  }
  return res.error || 'Không tải được báo cáo. Vui lòng thử lại.';
};

const LoginRequired: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-white p-4">
    <Result
      status="403"
      title="Báo cáo kiểm kê"
      subTitle="Trang này chỉ dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị rồi mở lại mục “Báo cáo”."
      extra={
        <Link href="/admin">
          <Button type="primary">Đến trang đăng nhập</Button>
        </Link>
      }
    />
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

  const monthOptions = buildMonthOptions(MONTH_OPTIONS_COUNT);
  const monthIndex = monthOptions.indexOf(month);
  // monthOptions[0] là tháng hiện tại, càng về sau càng cũ
  const olderMonth = monthOptions[monthIndex + 1];
  const newerMonth = monthIndex > 0 ? monthOptions[monthIndex - 1] : undefined;

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: { colorPrimary: '#1d4ed8', borderRadius: 8 },
        components: { Card: { headerFontSize: 16 } },
      }}
    >
      <div className="report-root min-h-screen w-full bg-gray-50 text-gray-900 print:bg-white">
        <style>{PRINT_CSS}</style>

        <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-8">
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
              <Space wrap>
                <Space.Compact>
                  <Button
                    aria-label="Tháng trước"
                    icon={<ChevronLeft className="h-4 w-4" />}
                    disabled={!olderMonth}
                    onClick={() => olderMonth && setMonth(olderMonth)}
                  />
                  <Select
                    value={month}
                    onChange={setMonth}
                    style={{ width: 150 }}
                    options={monthOptions.map(option => ({
                      value: option,
                      label: monthLabel(option),
                    }))}
                  />
                  <Button
                    aria-label="Tháng sau"
                    icon={<ChevronRight className="h-4 w-4" />}
                    disabled={!newerMonth}
                    onClick={() => newerMonth && setMonth(newerMonth)}
                  />
                </Space.Compact>
                <Button
                  title="Tính lại từ dữ liệu gốc, bỏ qua bản đã lưu của tháng cũ"
                  icon={<RefreshCw className="h-4 w-4" />}
                  loading={loading}
                  onClick={() => {
                    loadReport(month, true);
                    loadAttachments(month);
                  }}
                >
                  Tải lại
                </Button>
                <Button
                  type="primary"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={handlePrint}
                  disabled={!report}
                >
                  In / Lưu PDF
                </Button>
              </Space>
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
            <p className="text-sm text-muted-foreground">
              Kỳ báo cáo {formatDate(report.from)} – {periodEnd} (giờ Việt Nam)
              · Lập bởi {report.generatedBy || '—'} lúc{' '}
              {formatDateTime(report.generatedAt)}
              {report.cache?.source === 'snapshot' && report.cache.savedAt && (
                <Tag color="blue" className="!ml-2 print:hidden">
                  Số liệu đã lưu sẵn · bấm “Tải lại” nếu dữ liệu gốc đã đổi
                </Tag>
              )}
            </p>
          )}

          {error && (
            <Alert
              type="error"
              showIcon
              title={error}
              className="print:hidden"
              action={
                <Button size="small" onClick={() => loadReport(month)}>
                  Thử lại
                </Button>
              }
            />
          )}

          {loading && !report && (
            <Card>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          )}

          {report && (
            <Tabs
              activeKey={activeTab}
              onChange={key => setActiveTab(key as TabKey)}
              className="report-tabs"
              items={[
                {
                  key: 'director',
                  label: 'Báo cáo giám đốc',
                  children: (
                    <DirectorReport
                      report={report}
                      onEditExpenses={() => setExpensesDialogOpen(true)}
                      onViewDetail={() => setActiveTab('detail')}
                    />
                  ),
                },
                {
                  key: 'detail',
                  label: 'Chi tiết & đối chiếu',
                  children: (
                    <div className="space-y-8">
                      <div className="print:hidden">
                        {/* Không dùng antd Anchor ngang: nó gọi scrollIntoView
                            mỗi khi mục đang xem đổi, nên kéo trang giật lên
                            đầu khi thanh này đã cuộn khuất. */}
                        <nav className="flex flex-wrap gap-2">
                          {DETAIL_SECTION_LINKS.map(link => (
                            <a
                              key={link.key}
                              href={link.href}
                              className="rounded-full border bg-white px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
                            >
                              {link.title}
                            </a>
                          ))}
                        </nav>
                      </div>
                      <SummarySection report={report} />
                      <OrdersSection
                        orders={report.orders}
                        bank={buildBankLookup(
                          report.reconciliation.inbound,
                          report.reconciliation.hasData,
                          item => item.id
                        )}
                      />
                      <PayoutsSection
                        rows={report.payouts.rows}
                        summary={report.payouts.summary}
                        bank={buildBankLookup(
                          report.reconciliation.outbound,
                          report.reconciliation.hasData,
                          item => (item as ReconPayoutItem).consignmentId
                        )}
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
                    </div>
                  ),
                },
              ]}
            />
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

        <FloatButton.BackTop className="print:!hidden" />
      </div>
    </ConfigProvider>
  );
};

export default MonthlyReportPage;
