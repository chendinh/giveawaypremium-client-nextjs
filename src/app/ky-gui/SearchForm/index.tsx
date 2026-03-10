'use client';

import React, { useState, useEffect } from 'react';
import moment from 'moment';
import GapService from '@/app/actions/GapServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';

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

      console.log('fetchTableData');
      console.log(formData);

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

      console.log('res: ', res);

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

    return (
      <div
        key={item.objectId || index}
        className="note-box"
        style={
          item.isGetMoney
            ? { border: '1px solid #09e486', background: '#d2e8c9' }
            : {}
        }
      >
        <div className="note-box-content">
          <div className="note-item">
            <span className="note-label">Mã ký gửi:</span>
            <span className="note-value">{item.consignmentId || '---'}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Tên Khách Hàng:</span>
            <span className="note-value">{item.consignerName || '---'}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Số điện thoại:</span>
            <span className="note-value">{item.phoneNumber || '---'}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Số lượng hàng hoá:</span>
            <span className="note-value">{numberOfProducts}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Số lượng đã bán:</span>
            <span className="note-value">{numSoldConsignment}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Số lượng còn lại:</span>
            <span className="note-value">{remainNum}</span>
          </div>

          <div className="note-item">
            <span className="note-label">Ngân hàng đăng ký:</span>
            <span className="note-value">
              {item.banks?.[0]?.type || item.bankName || '---'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">ID ngân hàng:</span>
            <span className="note-value">
              {item.banks?.[0]?.accNumber || item.bankId || '---'}
            </span>
          </div>

          <div className="note-item">
            <span className="note-label">Hình thức ký gửi:</span>
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
                ? `${moment(item.group.timeGetMoney).format('DD-MM-YYYY')} -> ${moment(item.group.timeGetMoney).add(10, 'day').format('DD-MM-YYYY')}`
                : '---'}
            </span>
          </div>

          {!item.isGetMoney ? (
            <div className="note-item">
              <span className="note-label">Đã nhận tiền:</span>
              <span className="note-value note-value-pending">Chưa</span>
            </div>
          ) : (
            <div className="note-item">
              <span className="note-label">Ngày khách đã nhận tiền:</span>
              <span className="note-value note-value-done">
                {item.timeConfirmGetMoney
                  ? moment(item.timeConfirmGetMoney).format('DD-MM-YYYY')
                  : '---'}
              </span>
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
