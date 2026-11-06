'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { Loader2, RefreshCw } from 'lucide-react';
import { Chart } from 'react-chartjs-2';

import GapService from '@/app/actions/GapServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { currentVnMonth, formatDate, formatVnd, monthLabel } from '../format';
import { MonthlyReport, PayoutForecast } from '../types';

import { ReportSection } from './ReportSection';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend
);

/** Tạm thời chỉ tính từ tháng 1/2026 trở đi. */
const CASHFLOW_START_MONTH = '2026-01';
const CONCURRENCY = 2;

interface CashflowRow {
  month: string;
  /** Tổng tiền bán được (doanh thu) */
  revenueVnd: number;
  /** Tiền thực tế đã chuyển/trả cho khách ký gửi trong tháng (theo ngày xác nhận trả) */
  payoutVnd: number;
  /** Chi phí vận hành đã lưu của tháng */
  expensesVnd: number;
  /** revenueVnd − payoutVnd − expensesVnd */
  netVnd: number;
  /** Cộng dồn netVnd từ tháng bắt đầu = tiền shop thực nắm */
  cumulativeVnd: number;
}

interface CashflowSource {
  month: string;
  report: MonthlyReport | null;
}

const listMonths = (from: string, to: string): string[] => {
  const result: string[] = [];
  let [y, m] = from.split('-').map(Number);
  while (`${y}-${String(m).padStart(2, '0')}` <= to) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
};

const shortMonth = (month: string): string => {
  const [year, mon] = month.split('-');
  return `T${Number(mon)}/${year.slice(2)}`;
};

/** Rút gọn trục: 1,500,000 → 1.5tr */
const compactVnd = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}tr`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${value}`;
};

const buildRows = (sources: CashflowSource[]): CashflowRow[] => {
  let running = 0;
  return sources
    .filter(s => s.report)
    .map(({ month, report }) => {
      const r = report as MonthlyReport;
      const revenueVnd = r.totals.all.revenueVnd;
      const payoutVnd = r.payouts.summary.totalVnd;
      const expensesVnd = r.expenses.totalVnd;
      const netVnd = revenueVnd - payoutVnd - expensesVnd;
      running += netVnd;
      return {
        month,
        revenueVnd,
        payoutVnd,
        expensesVnd,
        netVnd,
        cumulativeVnd: running,
      };
    });
};

const Stat: React.FC<{
  label: string;
  value: number;
  hint?: string;
  tone?: 'default' | 'good' | 'bad';
  action?: React.ReactNode;
}> = ({ label, value, hint, tone = 'default', action }) => (
  <Card>
    <CardContent className="space-y-1 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-xl font-bold',
          tone === 'good' && 'text-green-700',
          tone === 'bad' && 'text-red-700'
        )}
      >
        {formatVnd(value)}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {action}
    </CardContent>
  </Card>
);

const ForecastBlock: React.FC<{ cashVnd: number }> = ({ cashVnd }) => {
  const [forecast, setForecast] = useState<PayoutForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closureOpen, setClosureOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await GapService.getPayoutForecast(CASHFLOW_START_MONTH);
      if (cancelled) return;
      if (res?.result) setForecast(res.result as PayoutForecast);
      else setError(res?.error || 'Không tải được dự báo chi trả.');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang ước tính tiền cần chi…
      </div>
    );
  }
  if (error || !forecast) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  const buckets = [
    ...(forecast.overdue.consignmentCount > 0
      ? [{ ...forecast.overdue, label: 'Quá hạn' }]
      : []),
    ...forecast.months.map((m, i) => ({
      ...m,
      label: i === 0 ? `${shortMonth(m.month)} (nay)` : shortMonth(m.month),
    })),
  ];
  const next = forecast.months[1];
  const mustPayVnd = next ? forecast.overdue.soldVnd + next.soldVnd : 0;
  const worstCaseVnd = next
    ? mustPayVnd + forecast.overdue.unsoldPotentialVnd + next.unsoldPotentialVnd
    : 0;
  const safeVnd = cashVnd - mustPayVnd;
  const safeWorstVnd = cashVnd - worstCaseVnd;
  const data = {
    labels: buckets.map(b => b.label),
    datasets: [
      {
        label: 'Đã bán (chắc chắn phải trả)',
        data: buckets.map(b => b.soldVnd),
        backgroundColor: '#dc2626',
        stack: 'due',
      },
      {
        label: 'Chưa bán (trả thêm nếu bán được)',
        data: buckets.map(b => b.unsoldPotentialVnd),
        backgroundColor: '#fca5a5',
        stack: 'due',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.dataset.label}: ${formatVnd(Number(ctx.parsed.y))}`,
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        ticks: { callback: (v: string | number) => compactVnd(Number(v)) },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">
          Ước tính tiền cần chi trả khách
        </h3>
        <p className="text-sm text-muted-foreground">
          Theo hạn trả của từng ký gửi (thường 2–3 tháng sau ngày ký gửi, dù đã
          bán hay chưa). Chỉ tính ký gửi chưa trả, tạo từ{' '}
          {formatDate(forecast.trackingStart)}.
        </p>
      </div>
      {next && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Tiền shop đang nắm" value={cashVnd} />
            <Stat
              label={`Cần chi ${monthLabel(next.month).toLowerCase()}`}
              value={mustPayVnd}
              hint={
                forecast.overdue.consignmentCount > 0
                  ? `Gồm ${forecast.overdue.consignmentCount} ký gửi quá hạn · ${next.consignmentCount} ký gửi đến hạn (phần đã bán)`
                  : `${next.consignmentCount} ký gửi đến hạn, tính phần đã bán`
              }
              tone="bad"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 print:hidden"
                  onClick={() => setClosureOpen(true)}
                >
                  Tất cả tháng
                </Button>
              }
            />
            <Stat
              label="Tối đa nếu bán hết"
              value={worstCaseVnd}
              hint="Trường hợp phải trả cả phần chưa bán"
            />
          </div>
          <div
            className={cn(
              'rounded-xl border-2 p-5 shadow-sm md:p-6',
              safeVnd >= 0
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-red-400 bg-red-50'
            )}
          >
            <p
              className={cn(
                'text-sm font-semibold uppercase tracking-wide',
                safeVnd >= 0 ? 'text-emerald-800' : 'text-red-800'
              )}
            >
              Nguồn tiền an toàn · {monthLabel(next.month)}
            </p>
            <p
              className={cn(
                'mt-1 text-4xl font-extrabold md:text-5xl',
                safeVnd >= 0 ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              {formatVnd(safeVnd)}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {safeVnd >= 0
                ? 'Số tiền shop được quyền sử dụng (đầu tư, việc khác) sau khi đã giữ đủ tiền trả khách ký gửi.'
                : 'Tiền đang nắm chưa đủ để trả khách ký gửi tháng tới. Không nên rút tiền ra.'}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              = Tiền shop đang nắm − tiền cần chi. Chưa tính doanh thu mới.
              {safeVnd >= 0 && safeWorstVnd < 0 && (
                <>
                  {' '}
                  Nếu phải trả cả phần chưa bán thì còn{' '}
                  <strong>{formatVnd(safeWorstVnd)}</strong>.
                </>
              )}
              {safeVnd >= 0 && safeWorstVnd >= 0 && (
                <>
                  {' '}
                  Mức thận trọng nhất (trả cả phần chưa bán):{' '}
                  <strong>{formatVnd(safeWorstVnd)}</strong>.
                </>
              )}
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-4">
          <div className="h-72">
            <Chart type="bar" data={data} options={options} />
          </div>
        </CardContent>
      </Card>
      <Dialog open={closureOpen} onOpenChange={setClosureOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-6 md:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl">
              Tổng tiền phải trả khách nếu đóng cửa
            </DialogTitle>
            <DialogDescription className="text-base">
              Hàng đã bán, chưa trả khách, ký gửi tạo từ{' '}
              {formatDate(forecast.closure.since)} đến nay (
              {forecast.closure.consignmentCount} ký gửi).
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-5xl font-extrabold text-slate-900">
              {formatVnd(forecast.closure.totalVnd)}
            </p>
          </div>

          <div
            className={cn(
              'rounded-xl border-2 p-5 text-lg',
              cashVnd >= forecast.closure.totalVnd
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-red-400 bg-red-50'
            )}
          >
            <p>
              Tiền shop đang nắm:{' '}
              <strong className="text-xl">{formatVnd(cashVnd)}</strong>
            </p>
            {cashVnd >= forecast.closure.totalVnd ? (
              <p className="mt-1">
                Đủ trả hết, dư{' '}
                <strong className="text-2xl text-emerald-700">
                  {formatVnd(cashVnd - forecast.closure.totalVnd)}
                </strong>
              </p>
            ) : (
              <p className="mt-1">
                Chưa đủ trả hết, thiếu{' '}
                <strong className="text-2xl text-red-700">
                  {formatVnd(forecast.closure.totalVnd - cashVnd)}
                </strong>
              </p>
            )}
          </div>

          {forecast.closure.overdueCount > 0 && (
            <p className="text-base font-medium text-amber-800">
              Trong đó {forecast.closure.overdueCount} ký gửi (
              {formatVnd(forecast.closure.overdueVnd)}) đã quá hạn trả.
            </p>
          )}

          {forecast.closure.byCreatedMonth.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-base">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Tháng ký gửi</th>
                    <th className="px-4 py-3 text-right">Số ký gửi</th>
                    <th className="px-4 py-3 text-right">Còn nợ khách</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.closure.byCreatedMonth.map(m => (
                    <tr key={m.month} className="border-t">
                      <td className="px-4 py-3">{monthLabel(m.month)}</td>
                      <td className="px-4 py-3 text-right">{m.count}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatVnd(m.vnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Chỉ gồm ký gửi đã đánh dấu chưa trả. Nếu có ký gửi cũ thực tế đã
            trả nhưng chưa bấm xác nhận thì số này sẽ cao hơn thực tế.
          </p>
        </DialogContent>
      </Dialog>
      {forecast.later.consignmentCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Ngoài ra còn {forecast.later.consignmentCount} ký gửi đến hạn xa hơn (
          {formatVnd(forecast.later.soldVnd)} đã bán).
        </p>
      )}
    </div>
  );
};

const CashflowSection: React.FC = () => {
  const [sources, setSources] = useState<CashflowSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedMonths, setFailedMonths] = useState<string[]>([]);
  const requestRef = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const requestId = ++requestRef.current;
    const months = listMonths(CASHFLOW_START_MONTH, currentVnMonth());
    setLoading(true);
    setFailedMonths([]);

    const results: CashflowSource[] = months.map(month => ({
      month,
      report: null,
    }));
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < months.length) {
        const index = cursor++;
        const res = await GapService.getMonthlyReport(months[index], refresh);
        results[index].report = res?.result
          ? (res.result as MonthlyReport)
          : null;
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (requestId !== requestRef.current) return;
    setSources(results);
    setFailedMonths(results.filter(s => !s.report).map(s => s.month));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => buildRows(sources), [sources]);
  const totals = useMemo(() => {
    const last = rows[rows.length - 1];
    return {
      revenueVnd: rows.reduce((s, r) => s + r.revenueVnd, 0),
      payoutVnd: rows.reduce((s, r) => s + r.payoutVnd, 0),
      expensesVnd: rows.reduce((s, r) => s + r.expensesVnd, 0),
      cashVnd: last ? last.cumulativeVnd : 0,
    };
  }, [rows]);

  const labels = rows.map(r => shortMonth(r.month));

  const splitData = {
    labels,
    datasets: [
      {
        label: 'Tiền bán được',
        data: rows.map(r => r.revenueVnd),
        backgroundColor: '#16a34a',
      },
      {
        label: 'Đã trả khách ký gửi (thực tế)',
        data: rows.map(r => r.payoutVnd),
        backgroundColor: '#f59e0b',
      },
    ],
  };

  const netData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Chi phí vận hành',
        data: rows.map(r => -r.expensesVnd),
        backgroundColor: '#ef4444',
      },
      {
        type: 'bar' as const,
        label: 'Còn lại trong tháng',
        data: rows.map(r => r.netVnd),
        backgroundColor: '#2563eb',
      },
      {
        type: 'line' as const,
        label: 'Tiền shop đang nắm (cộng dồn)',
        data: rows.map(r => r.cumulativeVnd),
        borderColor: '#111827',
        backgroundColor: '#111827',
        tension: 0.25,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar' | 'line'>) =>
            `${ctx.dataset.label}: ${formatVnd(Number(ctx.parsed.y))}`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: (v: string | number) => compactVnd(Number(v)) } },
    },
  };

  return (
    <ReportSection
      id="dong-tien"
      title="Dòng tiền"
      description={`Từ ${monthLabel(CASHFLOW_START_MONTH).toLowerCase()} đến nay. Lấy tiền bán được, trừ tiền đã trả khách ký gửi thực tế trong tháng và chi phí vận hành, ra tiền shop thực nắm.`}
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => load(true)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Tải lại
        </Button>
      }
    >
      {failedMonths.length > 0 && !loading && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="p-3 text-sm text-amber-800">
            Không tải được: {failedMonths.map(m => monthLabel(m)).join(', ')}.
            Số liệu bên dưới chưa gồm các tháng này.
          </CardContent>
        </Card>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tổng hợp dòng tiền…
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Tiền bán được" value={totals.revenueVnd} />
            <Stat label="Đã trả khách (thực tế)" value={totals.payoutVnd} />
            <Stat
              label="Chi phí vận hành"
              value={totals.expensesVnd}
              tone="bad"
            />
            <Stat
              label="Tiền shop đang nắm"
              value={totals.cashVnd}
              hint="Bán được − trả khách − chi phí, cộng dồn"
              tone={totals.cashVnd >= 0 ? 'good' : 'bad'}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">
                  Tiền bán được và tiền đã trả khách thực tế
                </p>
                <div className="h-72">
                  <Chart type="bar" data={splitData} options={options} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">
                  Sau chi phí: tiền shop thực nắm
                </p>
                <div className="h-72">
                  <Chart type="bar" data={netData} options={options} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">Tháng</th>
                  <th className="p-2 text-right">Tiền bán được</th>
                  <th className="p-2 text-right">Đã trả khách</th>
                  <th className="p-2 text-right">Chi phí</th>
                  <th className="p-2 text-right">Còn lại</th>
                  <th className="p-2 text-right">Shop đang nắm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.month} className="border-t">
                    <td className="p-2">{monthLabel(r.month)}</td>
                    <td className="p-2 text-right">
                      {formatVnd(r.revenueVnd)}
                    </td>
                    <td className="p-2 text-right">{formatVnd(r.payoutVnd)}</td>
                    <td className="p-2 text-right">
                      {formatVnd(r.expensesVnd)}
                    </td>
                    <td
                      className={cn(
                        'p-2 text-right',
                        r.netVnd < 0 && 'text-red-700'
                      )}
                    >
                      {formatVnd(r.netVnd)}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {formatVnd(r.cumulativeVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ForecastBlock cashVnd={totals.cashVnd} />
          <p className="text-xs text-muted-foreground">
            Tiền bán được tính theo ngày tạo đơn; tiền trả khách tính theo ngày
            xác nhận trả thực tế (có thể là hàng bán ở tháng khác). Chi phí lấy
            từ mục chi phí đã lưu của từng tháng.
          </p>
        </div>
      )}
    </ReportSection>
  );
};

export default CashflowSection;
