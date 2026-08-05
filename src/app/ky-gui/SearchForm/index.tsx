'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import GapService from '@/app/actions/GapServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import './style.scss';

// Helper function
const numberWithCommas = (x: number | string): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Types
interface BankInfo {
  type?: string;
  accNumber?: string;
}

interface GroupInfo {
  timeGetMoney?: string;
  timeConfirmGetMoney?: string;
}

interface ConsignmentData {
  objectId?: string;
  consignerName?: string;
  consignmentId?: string;
  consignerIdCard?: string;
  consigneeName?: string;
  timeGetMoney?: string;
  phoneNumber?: string;
  isTransferMoneyWithBank?: boolean;
  timeConfirmGetMoney?: string;
  numberOfProducts?: number | string;
  numSoldConsignment?: number | string;
  remainNumConsignment?: number | string;
  bankName?: string;
  bankId?: string;
  banks?: BankInfo[];
  moneyBack?: number;
  email?: string;
  isGetMoney?: boolean;
  group?: GroupInfo;
}

interface FormData {
  phoneNumber: string;
  consignerIdCard: string;
}

interface SearchFormProps {
  backConsignment: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ backConsignment }) => {
  // States
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    consignerIdCard: '',
  });
  const [consignmentData, setConsignmentData] = useState<ConsignmentData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isHideUserForm, setIsHideUserForm] = useState<boolean>(false);

  useEffect(() => {
    setFormData({
      phoneNumber: '',
      consignerIdCard: '',
    });
  }, []);

  const onConsign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setIsSearching(true);

    try {
      let res;

      if (formData.phoneNumber && formData.phoneNumber.length > 0) {
        res = await GapService.getConsignmentWithPhone(
          page,
          formData.phoneNumber
        );
      } else if (
        formData.consignerIdCard &&
        formData.consignerIdCard.length > 0
      ) {
        res = await GapService.getConsignmentWithID(
          page,
          formData.consignerIdCard
        );
      } else {
        setIsSearching(false);
        return;
      }

      if (res && res.results && res.results.length > 0) {
        setTotal(res.results.length);
        setConsignmentData(res.results);
        setIsHideUserForm(true);
        setIsSearching(false);
        setFormData({
          phoneNumber: '',
          consignerIdCard: '',
        });

        setTimeout(() => {
          setStep(1);
        }, 500);
      } else {
        setIsSearching(false);
        setFormData({
          phoneNumber: '',
          consignerIdCard: '',
        });
        toast.error('Không tìm thấy thông tin ký gửi');
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    }
  };

  const backProp = () => {
    setStep(0);
    setFormData({
      phoneNumber: '',
      consignerIdCard: '',
    });
    setConsignmentData([]);
    setTotal(0);
    setIsSearching(false);
    setIsHideUserForm(false);
    backConsignment();
  };

  const renderDrawItem = (item: ConsignmentData, index: number) => {
    const numberOfProducts = Number(item.numberOfProducts) || 0;
    const numSoldConsignment = Number(item.numSoldConsignment) || 0;
    const remainNum = numberOfProducts - numSoldConsignment;
    const soldPercent =
      numberOfProducts > 0
        ? Math.round((numSoldConsignment / numberOfProducts) * 100)
        : 0;

    // Xác định trạng thái hiện tại của đơn ký gửi
    const isFullySold = remainNum === 0 && numberOfProducts > 0;
    const isPaidOut = !!item.isGetMoney;

    type StageKey = 'received' | 'selling' | 'summary' | 'paidout';
    const stages: {
      key: StageKey;
      label: string;
      done: boolean;
      active: boolean;
    }[] = [
      {
        key: 'received',
        label: '✅ Đã tiếp nhận',
        done: true,
        active: false,
      },
      {
        key: 'selling',
        label: isFullySold ? '🎉 Bán hết' : `🏷️ Đang bán (${soldPercent}%)`,
        done: isFullySold,
        active: !isFullySold && !isPaidOut,
      },
      {
        key: 'summary',
        label: item.group?.timeGetMoney ? '📋 Đã tổng kết' : '📋 Chờ tổng kết',
        done: !!item.group?.timeGetMoney,
        active: isFullySold && !isPaidOut,
      },
      {
        key: 'paidout',
        label: isPaidOut ? '💰 Đã nhận tiền' : '💰 Chờ nhận tiền',
        done: isPaidOut,
        active: false,
      },
    ];

    return (
      <div
        key={item.objectId || index}
        className="note-box"
        style={
          isPaidOut
            ? { border: '1px solid #09e486', background: '#d2e8c9' }
            : {}
        }
      >
        <div className="note-box-content">
          {/* Header */}
          <div className="note-item">
            <span className="note-label">Mã ký gửi:</span>
            <span className="note-value font-mono">
              {item.consignmentId || '---'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Tên Khách Hàng:</span>
            <span className="note-value">{item.consignerName || '---'}</span>
          </div>

          {/* Timeline trạng thái */}
          <div className="mt-3 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {stages.map((stage, i) => (
                <React.Fragment key={stage.key}>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      stage.done
                        ? 'bg-green-100 text-green-800'
                        : stage.active
                          ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400'
                          : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {stage.label}
                  </span>
                  {i < stages.length - 1 && (
                    <span className="text-gray-300 text-xs">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>
                Đã bán: {numSoldConsignment}/{numberOfProducts} món
              </span>
              <span className="font-medium">{soldPercent}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  soldPercent === 100
                    ? 'bg-green-500'
                    : soldPercent >= 50
                      ? 'bg-blue-500'
                      : 'bg-yellow-400'
                )}
                style={{ width: `${soldPercent}%` }}
              />
            </div>
          </div>

          <div className="note-item">
            <span className="note-label">Còn lại:</span>
            <span
              className={cn(
                'note-value',
                remainNum === 0 && 'text-green-600 font-semibold'
              )}
            >
              {remainNum === 0 ? 'Bán hết rồi 🎉' : `${remainNum} món`}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Ngân hàng:</span>
            <span className="note-value">
              {item.banks?.[0]?.type || item.bankName || '---'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Số TK:</span>
            <span className="note-value font-mono">
              {item.banks?.[0]?.accNumber || item.bankId || '---'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Hình thức:</span>
            <span className="note-value">
              {item.isTransferMoneyWithBank ? 'Chuyển khoản' : 'Trực tiếp'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Tổng tiền:</span>
            <span className="note-value note-value-money">
              {item.moneyBack ? numberWithCommas(item.moneyBack * 1000) : '---'}{' '}
              vnđ
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Ngày tổng kết:</span>
            <span className="note-value">
              {item.group?.timeGetMoney
                ? `${format(parseISO(item.group.timeGetMoney), 'dd/MM/yyyy')} → ${format(addDays(parseISO(item.group.timeGetMoney), 10), 'dd/MM/yyyy')}`
                : 'Chưa xác định'}
            </span>
          </div>

          {isPaidOut ? (
            <div className="note-item">
              <span className="note-label">Ngày nhận tiền:</span>
              <span className="note-value note-value-done">
                {item.timeConfirmGetMoney
                  ? format(parseISO(item.timeConfirmGetMoney), 'dd/MM/yyyy')
                  : '---'}
              </span>
            </div>
          ) : (
            <div className="mt-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
              Tiền chưa được chuyển. Vui lòng liên hệ khi đến ngày tổng kết.
            </div>
          )}
        </div>
      </div>
    );
  };

  const isFormValid =
    (formData.phoneNumber && formData.phoneNumber.length > 0) ||
    (formData.consignerIdCard && formData.consignerIdCard.length > 0);

  return (
    <div className="searchform-home-container">
      <div className="searching-form">
        {/* Search Form */}
        <form
          className={`searching-box${!isHideUserForm && step === 0 ? ' show' : ''}`}
          onSubmit={onConsign}
        >
          <div className="sell-card-form">
            <h1 className="text text-searching-title">
              Tìm thông tin ký gửi qua số điện thoại
            </h1>

            <div className="form-field">
              <Label className="form-label">Số điện thoại</Label>
              <Input
                disabled={formData.consignerIdCard.length > 0}
                value={formData.phoneNumber}
                type="tel"
                onChange={e =>
                  setFormData({
                    phoneNumber: e.target.value.trim(),
                    consignerIdCard: '',
                  })
                }
                placeholder="Nhập số điện thoại..."
                className="form-input"
              />
            </div>

            {/* CMND field - uncomment if needed */}
            {/* <div className="form-field">
              <Label className="form-label">CMND</Label>
              <Input
                disabled={formData.phoneNumber.length > 0}
                value={formData.consignerIdCard}
                type="text"
                onChange={(e) =>
                  setFormData({
                    consignerIdCard: e.target.value.trim(),
                    phoneNumber: '',
                  })
                }
                placeholder="Nhập số CMND..."
                className="form-input"
              />
            </div> */}

            <div className="form-buttons">
              <Button type="button" variant="secondary" onClick={backProp}>
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={!isFormValid || isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Tìm kiếm
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Results */}
        <div
          className={`searching-table${isHideUserForm && step === 1 ? ' show' : ''}`}
        >
          <div className="searching-table-content">
            {total > 0 && (
              <p className="result-count">Tìm thấy {total} đơn ký gửi</p>
            )}

            <div className="consignment-grid">
              {consignmentData.map((item, index) =>
                renderDrawItem(item, index)
              )}
            </div>

            {consignmentData.length === 0 && (
              <div className="no-result">
                <p>Không tìm thấy thông tin ký gửi nào.</p>
                <p className="no-result-hint">
                  Vui lòng kiểm tra lại số điện thoại hoặc liên hệ hotline
                  0703334443
                </p>
              </div>
            )}

            <div className="back-button">
              <Button variant="secondary" onClick={backProp}>
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
