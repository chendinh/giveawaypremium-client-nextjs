'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Helper
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Data ────────────────────────────────────────────
const FEE_TIERS = [
  { range: 'Dưới 1 triệu', fee: '26%', highlight: false },
  { range: 'Từ 1 – 10 triệu', fee: '23%', highlight: false },
  { range: 'Trên 10 triệu', fee: '20%', highlight: true },
  { range: 'Luxury / chủ Brand', fee: 'Thoả thuận', highlight: false },
];

const CRITERIA = [
  'Giá ký gửi là giá thanh lý — dựa trên chất liệu, kiểu dáng, thương hiệu.',
  'Chỉ nhận sản phẩm có thương hiệu (global / local), authentic, tình trạng mới từ 80% trở lên.',
  'Mỹ phẩm còn hạn dùng tối thiểu 6 tháng (GAP hỗ trợ check date).',
  'Không nhận: hàng Quảng Châu, hàng không thương hiệu, hàng fake, mỹ phẩm hết date.',
];

const NOTES = [
  'Sau khi được double-check bởi CTV chuyên viên trong và ngoài nước, nếu phát hiện fake, GAP sẽ lưu kho và hoàn trả khi đến hẹn ghi trên biên nhận.',
  'GAP.Q1 hỗ trợ dịch vụ chuyển khoản tất toán (có phí) và ship hàng tồn tận nhà (khách thanh toán phí ship).',
];

// ─── Fee calc ────────────────────────────────────────
function calcFee(amount: number): number {
  if (amount <= 0) return 0;
  if (amount < 1_000_000) return (amount * 74) / 100;
  if (amount <= 10_000_000) return (amount * 77) / 100;
  return (amount * 80) / 100;
}

interface InstrumentFormProps {
  backConsignment: () => void;
}

const InstrumentForm: React.FC<InstrumentFormProps> = ({ backConsignment }) => {
  const [visible, setVisible] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [moneyBack, setMoneyBack] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);
    const num = parseFloat(val) || 0;
    setMoneyBack(num > 0 ? calcFee(num) : null);
  };

  return (
    <div className="w-full min-h-screen py-10 px-4 flex justify-center">
      <div
        className={cn(
          'w-full max-w-2xl transition-all duration-700 ease-out',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {/* ── Header ── */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-8">
          Phương Thức Ký Gửi
        </h1>

        {/* ── Bảng phí ── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Phí dịch vụ
          </h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Giá trị sản phẩm
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Phí ký gửi
              </span>
            </div>
            {FEE_TIERS.map((tier, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-2 px-4 py-3.5 border-b border-gray-100 last:border-0',
                  tier.highlight && 'bg-green-50'
                )}
              >
                <span className="text-sm text-gray-700">{tier.range}</span>
                <span
                  className={cn(
                    'text-sm font-semibold text-right',
                    tier.highlight ? 'text-green-700' : 'text-gray-800'
                  )}
                >
                  {tier.fee}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Calculator ── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Tính nhanh tiền nhận về
          </h2>
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="relative">
              <Input
                value={rawInput}
                type="number"
                onChange={handleInput}
                placeholder="Nhập giá dự định ký gửi..."
                className="pr-12 text-base"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                vnđ
              </span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-300',
                moneyBack !== null
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-transparent'
              )}
            >
              <span className="text-sm text-gray-500">Bạn nhận về</span>
              <span className="text-base font-bold text-green-700">
                {moneyBack !== null
                  ? `${numberWithCommas(Math.round(moneyBack))} vnđ`
                  : '---'}
              </span>
            </div>
          </div>
        </section>

        {/* ── Thời gian & Số lượng ── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Điều kiện
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 px-4 py-3.5">
              <p className="text-xs text-gray-400 mb-1">Thời gian ký gửi</p>
              <p className="text-sm font-medium text-gray-800">
                50 – 70 ngày, tuỳ đợt
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3.5">
              <p className="text-xs text-gray-400 mb-1">Số lượng tối thiểu</p>
              <p className="text-sm font-medium text-gray-800">
                5 món / đơn (hoặc theo giá trị)
              </p>
            </div>
          </div>
        </section>

        {/* ── Tiêu chí ── */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Tiêu chí nhận hàng
          </h2>
          <ul className="space-y-2.5">
            {CRITERIA.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Lưu ý ── */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Lưu ý khác
          </h2>
          <div className="space-y-2.5">
            {NOTES.map((note, i) => (
              <div
                key={i}
                className="flex gap-3 items-start rounded-lg bg-gray-50 border border-gray-100 px-4 py-3"
              >
                <span className="text-gray-400 mt-0.5 flex-shrink-0">ℹ︎</span>
                <span className="text-sm text-gray-600 leading-relaxed">
                  {note}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Back ── */}
        <div className="flex justify-center pb-6">
          <Button
            variant="outline"
            onClick={backConsignment}
            className="min-w-[140px]"
          >
            ← Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstrumentForm;
