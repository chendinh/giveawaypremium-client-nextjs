'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import QRCode from 'qrcode';
import './styles.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface TagQrcodeData {
  code?: string;
  name?: string;
  price?: number;
  isNew?: string;
  rateNew?: number;
}

interface TagQrcodeProps {
  data: TagQrcodeData;
}

// ─── Component ────────────────────────────────────────
const TagQrcode = forwardRef<HTMLDivElement, TagQrcodeProps>(
  ({ data }, ref) => {
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
      const generateQrcode = async () => {
        if (!data.code) return;
        const dataString = await QRCode.toString(data.code, {
          margin: 0,
          type: 'svg',
          width: 100,
        });
        if (typeof dataString === 'string') {
          const formatted = dataString.replace(
            '<svg',
            '<svg style="width:10mm;height:10mm" class="walletconnect-qrcode__image"'
          );
          setSvg(formatted);
        }
      };
      generateQrcode();
    }, [data.code]);

    const customNameProduct =
      (data.name ?? '').length > 55
        ? `${(data.name ?? '').slice(0, 55)}...`
        : (data.name ?? '---');

    return (
      <div className="BoxContainerTag" ref={ref}>
        <div className="qrcode" id="qrcode">
          <div className="leftBox">
            <p className="leftBoxCode">{data.code}</p>
            <div
              className="qrcodeImgBox"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>

          <div className="rightBox">
            <span className="rightBoxName">{customNameProduct}</span>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <span className="rightBoxNewUsed">
                ({data.isNew === 'new' || data.rateNew === 100 ? 'NEW' : 'USED'}
                )
              </span>
              <span className="price">
                {numberWithCommas((data.price ?? 0) * 1000)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TagQrcode.displayName = 'TagQrcode';

export default TagQrcode;
