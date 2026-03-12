'use client';

import React from 'react';
import moment from 'moment';
import './styles.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface ProductItem {
  name?: string;
  price?: number | string;
  count?: number;
}

interface ReceiptData {
  objectIdOrder?: string;
  productList?: ProductItem[];
  totalNumberOfProductForSale?: number | string;
  totalMoneyForSale?: number | string;
}

interface ReceiptOfflineProps {
  data: ReceiptData;
}

// ─── Component ────────────────────────────────────────
const ReceiptOffline = React.forwardRef<HTMLDivElement, ReceiptOfflineProps>(
  ({ data = {} }, ref) => {
    const { productList = [] } = data;

    return (
      <div className="BoxContainer" ref={ref}>
        <style type="text/css" media="print">
          {'@page { size: portrait; }'}
        </style>
        <div className="BoxTicket">
          <div className="BoxHeader">
            <p>GIVE AWAY PREMIUM QUẬN 1</p>
            <p style={{ marginBottom: '0px' }}>Địa chỉ: 01 Phó Đức Chính</p>
            <p>phường Nguyễn Thái Bình, Q1, HCM</p>
            <p>Hotline: 0703.334.443</p>
            <p style={{ marginBottom: '0px' }}>Facebook: Give Away Premium Quận 1</p>
            <p>Instagram: @giveawaypremium_quan1</p>
          </div>
          <div className="BoxContent">
            <div className="BoxCol">
              <p>Mã đơn hàng:</p>
              <p>{data.objectIdOrder || '#'}</p>
            </div>
            <div className="BoxCol">
              <p>Ngày:</p>
              <p>{moment().format('DD-MM-YYYY HH:mm:ss')}</p>
            </div>
            <table className="MainTable">
              <tbody>
                <tr className="header">
                  <td>#</td>
                  <td>Sản phẩm</td>
                  <td>SL</td>
                  <td>Tổng</td>
                </tr>
                {productList.map((item, itemIndex) => (
                  <tr key={itemIndex} className="header">
                    <td>{itemIndex + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.count}</td>
                    <td>{numberWithCommas(item.price || '0')},000đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="SubTable">
              <tbody>
                <tr>
                  <th>Tổng sản phẩm:</th>
                  <td>{data.totalNumberOfProductForSale}</td>
                </tr>
                <tr>
                  <th>Tổng tiền:</th>
                  <td>{numberWithCommas(data.totalMoneyForSale || '0')},000đ</td>
                </tr>
              </tbody>
            </table>
            <div className="LegalCopy">
              <strong>Lưu ý:</strong>
              <p>HÀNG ĐÃ MUA KHÔNG ĐỔI TRẢ</p>
              <p className="camon">Cảm ơn và hẹn gặp lại quý khách!</p>
              <br />
              <br />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptOffline.displayName = 'ReceiptOffline';

export default ReceiptOffline;
