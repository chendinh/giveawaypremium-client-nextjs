'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Loader2,
  Users,
  DollarSign,
  Banknote,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  CalendarIcon,
  RefreshCw,
  Globe,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

import GapService from '@/app/actions/GapServices';

import './style.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number): string =>
  Math.round(x)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface SummaryData {
  totalOrder: number;
  totalProduct: number;
  moneyForSale: number;
  moneyAfterFee: number;
  moneyFromFee: number;
  transferBankMoneyAmount: number;
  transferOfflineMoneyAmount: number;
  numberOnlineSale: number;
  numberOfflineSale: number;
  moneyForOnlineSale: number;
  moneyForOfflineSale: number;
}

const initialSummary: SummaryData = {
  totalOrder: 0,
  totalProduct: 0,
  moneyForSale: 0,
  moneyAfterFee: 0,
  moneyFromFee: 0,
  transferBankMoneyAmount: 0,
  transferOfflineMoneyAmount: 0,
  numberOnlineSale: 0,
  numberOfflineSale: 0,
  moneyForOnlineSale: 0,
  moneyForOfflineSale: 0,
};

// ─── Quick range shortcuts ─────────────────────────────
const now = new Date();
const QUICK_RANGES = [
  {
    label: 'Tháng này',
    from: startOfMonth(now),
    to: endOfMonth(now),
  },
  {
    label: 'Tháng trước',
    from: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
  },
  {
    label: 'Quý này',
    from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
    to: endOfMonth(
      new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 2, 1)
    ),
  },
  {
    label: 'Năm nay',
    from: new Date(now.getFullYear(), 0, 1),
    to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
  },
] as const;

// ─── Stat Card Component ──────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  className,
}) => (
  <Card className={cn('flex-1 min-w-[200px]', className)}>
    <div className="flex flex-row items-center justify-between p-4 pb-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {icon}
    </div>
    <CardContent className="pt-0">
      <div className="text-xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// ─── Component ────────────────────────────────────────
const SummaryScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Default: tháng hiện tại
  const [fromDate, setFromDate] = useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [toDate, setToDate] = useState<Date>(() => endOfMonth(new Date()));

  // Lưu pending selection — chỉ apply khi bấm "Cập nhật"
  const [pendingFrom, setPendingFrom] = useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [pendingTo, setPendingTo] = useState<Date>(() =>
    endOfMonth(new Date())
  );

  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchSummaryData = useCallback(async (from: Date, to: Date) => {
    // Huỷ request cũ nếu có
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      // Đảm bảo toDate là cuối ngày 23:59:59.999
      const fromISO = startOfDay(from).toISOString();
      const toISO = endOfDay(to).toISOString();

      const res = await GapService.getOrderSummary(fromISO, toISO);

      if (res?.result) {
        setSummary(res.result);
        setHasFetched(true);
      } else if (res?.error) {
        toast.error(`Lỗi từ server: ${res.error}`);
      } else {
        toast.error('Không thể tải dữ liệu thống kê');
      }
    } catch (err) {
      console.error('Error fetching summary data:', err);
      toast.error('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApply = () => {
    setFromDate(pendingFrom);
    setToDate(pendingTo);
    fetchSummaryData(pendingFrom, pendingTo);
  };

  // Tự động fetch tháng này khi vào màn hình lần đầu
  useEffect(() => {
    fetchSummaryData(startOfMonth(new Date()), endOfMonth(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickRange = (from: Date, to: Date) => {
    setPendingFrom(from);
    setPendingTo(to);
    setFromDate(from);
    setToDate(to);
    fetchSummaryData(from, to);
  };

  // ─── Chart Data ─────────────────────────────────────
  const revenueBarData = {
    labels: ['Doanh thu', 'Trả khách', 'Lợi nhuận', 'Tiền mặt', 'Chuyển khoản'],
    datasets: [
      {
        label: 'Số tiền (vnđ)',
        data: [
          summary.moneyForSale * 1000,
          summary.moneyAfterFee * 1000,
          summary.moneyFromFee * 1000,
          summary.transferOfflineMoneyAmount * 1000,
          summary.transferBankMoneyAmount * 1000,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(14, 165, 233, 0.7)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(14, 165, 233)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Tổng quan doanh thu' },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: { size: 11 },
          // Rút ngắn label trên màn hình nhỏ
          callback: function (this: unknown, _val: unknown, index: number) {
            const labels = [
              'Doanh thu',
              'Trả khách',
              'Lợi nhuận',
              'Tiền mặt',
              'CK',
            ];
            return labels[index] ?? '';
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 6,
          callback: (value: string | number) => {
            const n = Number(value);
            if (n >= 1_000_000_000)
              return (n / 1_000_000_000).toFixed(1) + 'tỷ';
            if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'tr';
            return numberWithCommas(n) + 'đ';
          },
        },
      },
    },
  };

  const onlineOfflinePieData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [summary.numberOnlineSale, summary.numberOfflineSale],
        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(249, 115, 22, 0.7)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(249, 115, 22)'],
        borderWidth: 1,
      },
    ],
  };

  const onlineOfflinePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Đơn hàng Online vs Offline' },
    },
  };

  const revenuePieData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [
          summary.moneyForOnlineSale * 1000,
          summary.moneyForOfflineSale * 1000,
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  };

  const revenuePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Doanh thu Online vs Offline' },
    },
  };

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="summary-screen-container p-4 space-y-6">
      {/* Date Picker & Controls */}
      <div className="space-y-3">
        {/* Quick ranges */}
        <div className="flex flex-wrap gap-2">
          {QUICK_RANGES.map(r => (
            <Button
              key={r.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickRange(r.from, r.to)}
              className={cn(
                'text-xs',
                format(fromDate, 'yyyy-MM-dd') ===
                  format(r.from, 'yyyy-MM-dd') &&
                  format(toDate, 'yyyy-MM-dd') === format(r.to, 'yyyy-MM-dd')
                  ? 'bg-primary text-primary-foreground'
                  : ''
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* From date */}
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-[160px] justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(pendingFrom, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pendingFrom}
                onSelect={d => {
                  if (d) {
                    setPendingFrom(d);
                    // Nếu from > to thì tự điều chỉnh to = from
                    if (d > pendingTo) setPendingTo(d);
                  }
                  setFromOpen(false);
                }}
                disabled={d => d > new Date()}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">—</span>

          {/* To date */}
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-[160px] justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(pendingTo, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pendingTo}
                onSelect={d => {
                  if (d) setPendingTo(d);
                  setToOpen(false);
                }}
                disabled={d => d < pendingFrom || d > new Date()}
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleApply}
            variant="default"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Cập nhật
          </Button>
        </div>
      </div>

      {/* Empty state — chưa fetch lần nào */}
      {!hasFetched && !isLoading && (
        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
          <CalendarIcon className="h-10 w-10 opacity-30" />
          <p className="text-sm">
            Chọn khoảng thời gian và bấm <strong>Cập nhật</strong> để xem thống
            kê.
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Stats & Charts — chỉ hiển thị sau khi có data */}
      {hasFetched && !isLoading && (
        <>
          {/* Hero row — 2 chỉ số quan trọng nhất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <div className="flex flex-row items-center justify-between p-5 pb-2">
                <p className="text-sm font-medium text-green-700">Doanh thu</p>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <CardContent className="pt-0 pb-5 px-5">
                <div className="text-3xl font-bold text-green-800">
                  {numberWithCommas(summary.moneyForSale * 1000)}
                  <span className="text-lg font-normal text-green-600 ml-1">
                    đ
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Lợi nhuận: {numberWithCommas(summary.moneyFromFee * 1000)}đ
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <div className="flex flex-row items-center justify-between p-5 pb-2">
                <p className="text-sm font-medium text-blue-700">Đơn hàng</p>
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <CardContent className="pt-0 pb-5 px-5">
                <div className="text-3xl font-bold text-blue-800">
                  {summary.totalOrder}
                  <span className="text-lg font-normal text-blue-600 ml-1">
                    đơn
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {summary.totalProduct} sản phẩm · Online{' '}
                  {summary.numberOnlineSale} / Offline{' '}
                  {summary.numberOfflineSale}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary row — thanh toán */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Tiền mặt"
              value={`${numberWithCommas(summary.transferOfflineMoneyAmount * 1000)}đ`}
              icon={<Banknote className="h-4 w-4 text-yellow-500" />}
            />
            <StatCard
              title="Chuyển khoản"
              value={`${numberWithCommas(summary.transferBankMoneyAmount * 1000)}đ`}
              icon={<CreditCard className="h-4 w-4 text-sky-500" />}
            />
            <StatCard
              title="Trả khách"
              value={`${numberWithCommas(summary.moneyAfterFee * 1000)}đ`}
              icon={<Users className="h-4 w-4 text-orange-500" />}
            />
            <StatCard
              title="Phí dịch vụ"
              value={`${numberWithCommas(summary.moneyFromFee * 1000)}đ`}
              icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
            />
          </div>

          {/* Online / Offline detail row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Đơn online"
              value={summary.numberOnlineSale}
              icon={<Globe className="h-4 w-4 text-blue-500" />}
            />
            <StatCard
              title="DT online"
              value={`${numberWithCommas(summary.moneyForOnlineSale * 1000)}đ`}
              icon={<Globe className="h-4 w-4 text-green-500" />}
            />
            <StatCard
              title="Đơn offline"
              value={summary.numberOfflineSale}
              icon={<Store className="h-4 w-4 text-orange-500" />}
            />
            <StatCard
              title="DT offline"
              value={`${numberWithCommas(summary.moneyForOfflineSale * 1000)}đ`}
              icon={<Store className="h-4 w-4 text-red-500" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-[350px]">
                  <Bar data={revenueBarData} options={revenueBarOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-[350px]">
                  <Pie
                    data={onlineOfflinePieData}
                    options={onlineOfflinePieOptions}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-[350px]">
                  <Pie data={revenuePieData} options={revenuePieOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SummaryScreen;
