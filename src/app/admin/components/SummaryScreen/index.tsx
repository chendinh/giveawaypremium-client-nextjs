'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Package,
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
import moment from 'moment';
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

// Register Chart.js components
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
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const convertPriceAfterFee = (productPrice: number = 0): number => {
  let moneyBackForFullSold = Number(productPrice);
  if (productPrice > 0) {
    if (productPrice < 1000) {
      moneyBackForFullSold = (productPrice * 74) / 100;
    } else if (productPrice >= 1000 && productPrice <= 10000) {
      moneyBackForFullSold = (productPrice * 77) / 100;
    } else if (productPrice > 10000) {
      moneyBackForFullSold = (productPrice * 80) / 100;
    }
    return moneyBackForFullSold;
  }
  return 0;
};

// ─── Types ────────────────────────────────────────────
interface OrderItem {
  objectId: string;
  totalMoneyForSale?: number | string;
  totalNumberOfProductForSale?: number | string;
  isOnlineSale?: boolean;
  transferBankMoneyAmount?: number | string;
  transferOfflineMoneyAmount?: number | string;
  createdAt?: string;
}

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
  dataOrderList: OrderItem[];
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
  dataOrderList: [],
};

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
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// ─── Component ────────────────────────────────────────
const SummaryScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  // Initialize dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(firstDay);
    setToDate(lastDay);
  }, []);

  // Fetch data when dates are set
  const fetchSummaryData = useCallback(async () => {
    if (!fromDate || !toDate) return;

    setIsLoading(true);
    try {
      const fromMoment = moment(fromDate).format('YYYY-MM-DD');
      const toMoment = moment(toDate).format('YYYY-MM-DD');
      const orderList = await GapService.getOrder(
        1,
        null,
        100000,
        fromMoment,
        toMoment
      );

      let moneyForSale = 0;
      let moneyAfterFee = 0;
      let moneyFromFee = 0;
      let totalProduct = 0;
      let transferBankMoneyAmount = 0;
      let transferOfflineMoneyAmount = 0;
      let numberOnlineSale = 0;
      let numberOfflineSale = 0;
      let moneyForOnlineSale = 0;
      let moneyForOfflineSale = 0;

      if (orderList?.results?.length > 0) {
        orderList.results.forEach((item: OrderItem) => {
          moneyForSale += Number(item.totalMoneyForSale || 0);
          moneyAfterFee += Math.floor(
            convertPriceAfterFee(Number(item.totalMoneyForSale))
          );
          totalProduct += Number(item.totalNumberOfProductForSale || 0);
          transferBankMoneyAmount += Number(item.transferBankMoneyAmount || 0);
          transferOfflineMoneyAmount += Number(
            item.transferOfflineMoneyAmount || 0
          );

          if (item.isOnlineSale) {
            numberOnlineSale += 1;
            moneyForOnlineSale += Number(item.totalMoneyForSale || 0);
          } else {
            numberOfflineSale += 1;
            moneyForOfflineSale += Number(item.totalMoneyForSale || 0);
          }
        });

        moneyFromFee = moneyForSale - moneyAfterFee;

        setSummary({
          moneyForSale,
          moneyAfterFee,
          moneyFromFee,
          totalProduct,
          dataOrderList: orderList.results,
          totalOrder: orderList.count || orderList.results.length,
          transferBankMoneyAmount,
          transferOfflineMoneyAmount,
          numberOnlineSale,
          numberOfflineSale,
          moneyForOnlineSale,
          moneyForOfflineSale,
        });
      } else {
        setSummary({
          ...initialSummary,
          totalOrder: orderList?.count || 0,
          dataOrderList: orderList?.results || [],
        });
      }
    } catch (err) {
      console.error('Error fetching summary data:', err);
      toast.error('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchSummaryData();
    }
  }, [fromDate, toDate, fetchSummaryData]);

  // ─── Chart Data ─────────────────────────────────────
  const revenueBarData = {
    labels: [
      'Doanh thu',
      'Trả khách',
      'Lợi nhuận',
      'Tiền mặt',
      'Chuyển khoản',
    ],
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
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) =>
            numberWithCommas(Number(value)) + 'đ',
        },
      },
    },
  };

  const onlineOfflinePieData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [summary.numberOnlineSale, summary.numberOfflineSale],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(249, 115, 22, 0.7)',
        ],
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
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="summary-screen-container p-4 space-y-6">
      {/* Date Picker & Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[180px] justify-start text-left font-normal',
                !fromDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? moment(fromDate).format('DD/MM/YYYY') : 'Từ ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={d => {
                setFromDate(d);
                setFromOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">—</span>

        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[180px] justify-start text-left font-normal',
                !toDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? moment(toDate).format('DD/MM/YYYY') : 'Đến ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={d => {
                setToDate(d);
                setToOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Button onClick={fetchSummaryData} variant="default" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Cập nhật
        </Button>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SL Khách"
          value={summary.totalOrder}
          icon={<Users className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="SL Sản phẩm"
          value={summary.totalProduct}
          icon={<Package className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title="Số tiền bán"
          value={`${numberWithCommas(summary.moneyForSale * 1000)} vnđ`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title="Lợi nhuận"
          value={`${numberWithCommas(summary.moneyFromFee * 1000)} vnđ`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tiền mặt"
          value={`${numberWithCommas(summary.transferOfflineMoneyAmount * 1000)} vnđ`}
          icon={<Banknote className="h-5 w-5 text-yellow-500" />}
        />
        <StatCard
          title="Tiền chuyển khoản"
          value={`${numberWithCommas(summary.transferBankMoneyAmount * 1000)} vnđ`}
          icon={<CreditCard className="h-5 w-5 text-sky-500" />}
        />
        <StatCard
          title="Số tiền trả khách"
          value={`${numberWithCommas(summary.moneyAfterFee * 1000)} vnđ`}
          icon={<ShoppingCart className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={summary.totalOrder}
          icon={<ShoppingCart className="h-5 w-5 text-indigo-500" />}
        />
      </div>

      {/* Stat Cards Row 3 - Online/Offline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SL đơn online"
          value={summary.numberOnlineSale}
          icon={<Globe className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Doanh thu online"
          value={`${numberWithCommas(summary.moneyForOnlineSale * 1000)} vnđ`}
          icon={<Globe className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title="SL đơn offline"
          value={summary.numberOfflineSale}
          icon={<Store className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          title="Doanh thu offline"
          value={`${numberWithCommas(summary.moneyForOfflineSale * 1000)} vnđ`}
          icon={<Store className="h-5 w-5 text-red-500" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <Card>
          <CardContent className="pt-6">
            <div className="h-[350px]">
              <Bar data={revenueBarData} options={revenueBarOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Online vs Offline Order Count Pie */}
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

      {/* Revenue Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[350px]">
              <Pie data={revenuePieData} options={revenuePieOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryScreen;
