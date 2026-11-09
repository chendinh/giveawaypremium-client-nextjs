/**
 * Tạo mã VietQR (chuyển nhanh NAPAS 247 tới số tài khoản) hoàn toàn ở client,
 * không gọi dịch vụ ngoài. Chuỗi trả về đưa vào thư viện `qrcode` để vẽ.
 *
 * Quy ước nội dung trả tiền ký gửi: "TRA <mã ký gửi>", trong đó dấu phân cách
 * của mã đổi thành khoảng trắng ("47-1126" → "TRA 47 1126"). Nhiều ngân hàng bỏ
 * ký tự đặc biệt khỏi nội dung, và server (auto-mark-paid.ts) đọc đúng định
 * dạng này để tự đánh dấu "đã trả" — hai nơi phải giữ cùng quy ước.
 */

interface BankInfo {
  /** Mã BIN do NAPAS cấp */
  bin: string;
  name: string;
  /** Các cách gõ tên thường gặp, đã bỏ dấu, viết thường, bỏ khoảng trắng */
  aliases: readonly string[];
}

/**
 * BIN lấy từ danh sách công khai của VietQR (api.vietqr.io/v2/banks), chỉ giữ
 * ngân hàng hỗ trợ chuyển tiền tới số tài khoản.
 */
const BANKS: readonly BankInfo[] = [
  { bin: '970436', name: 'Vietcombank', aliases: ['vietcombank', 'vcb', 'ngoaithuong'] },
  { bin: '970415', name: 'VietinBank', aliases: ['vietinbank', 'viettinbank', 'ctg', 'icb', 'congthuong'] },
  { bin: '970418', name: 'BIDV', aliases: ['bidv', 'dautuvaphattrien'] },
  { bin: '970405', name: 'Agribank', aliases: ['agribank', 'vba', 'nongnghiep'] },
  { bin: '970422', name: 'MB Bank', aliases: ['mbbank', 'mb', 'quandoi'] },
  { bin: '970407', name: 'Techcombank', aliases: ['techcombank', 'tcb', 'kythuong'] },
  { bin: '970416', name: 'ACB', aliases: ['acb', 'achau'] },
  { bin: '970432', name: 'VPBank', aliases: ['vpbank', 'vpb', 'thinhvuong'] },
  { bin: '970423', name: 'TPBank', aliases: ['tpbank', 'tpb', 'tienphong'] },
  { bin: '970403', name: 'Sacombank', aliases: ['sacombank', 'stb', 'saigonthuongtin'] },
  { bin: '970437', name: 'HDBank', aliases: ['hdbank', 'hdb'] },
  { bin: '970441', name: 'VIB', aliases: ['vib', 'quocte'] },
  { bin: '970443', name: 'SHB', aliases: ['shb', 'saigonhanoi'] },
  { bin: '970431', name: 'Eximbank', aliases: ['eximbank', 'exim', 'eib'] },
  { bin: '970426', name: 'MSB', aliases: ['msb', 'hanghai', 'maritimebank'] },
  { bin: '970448', name: 'OCB', aliases: ['ocb', 'phuongdong'] },
  { bin: '970440', name: 'SeABank', aliases: ['seabank', 'seab', 'dongnama'] },
  { bin: '970449', name: 'LPBank', aliases: ['lpbank', 'lpb', 'lienvietpostbank', 'lienviet'] },
  { bin: '970429', name: 'SCB', aliases: ['scb'] },
  { bin: '970425', name: 'ABBANK', aliases: ['abbank', 'abb', 'anbinh'] },
  { bin: '970409', name: 'Bac A Bank', aliases: ['bacabank', 'bab', 'baca'] },
  { bin: '970428', name: 'Nam A Bank', aliases: ['namabank', 'nab', 'nama'] },
  { bin: '970419', name: 'NCB', aliases: ['ncb', 'quocdan'] },
  { bin: '970412', name: 'PVcomBank', aliases: ['pvcombank', 'pvcb', 'daichung'] },
  { bin: '970433', name: 'VietBank', aliases: ['vietbank', 'thuongtin'] },
  { bin: '970452', name: 'KienLongBank', aliases: ['kienlongbank', 'klb', 'kienlong'] },
  { bin: '970438', name: 'BaoVietBank', aliases: ['baovietbank', 'bvb', 'baoviet'] },
  { bin: '970430', name: 'PGBank', aliases: ['pgbank', 'pgb'] },
  { bin: '970454', name: 'BVBank (Bản Việt)', aliases: ['bvbank', 'vietcapitalbank', 'vccb', 'banviet'] },
  { bin: '970424', name: 'Shinhan Bank', aliases: ['shinhanbank', 'shinhan', 'shbvn'] },
  { bin: '970457', name: 'Woori Bank', aliases: ['woori', 'wooribank', 'wvn'] },
  { bin: '970400', name: 'SaigonBank', aliases: ['saigonbank', 'sgicb', 'saigoncongthuong'] },
  { bin: '970427', name: 'VietABank', aliases: ['vietabank', 'vab'] },
  { bin: '970446', name: 'Co-opBank', aliases: ['coopbank', 'hoptacxa'] },
  { bin: '970434', name: 'Indovina Bank', aliases: ['indovinabank', 'indovina', 'ivb'] },
  { bin: '970444', name: 'CBBank', aliases: ['cbbank', 'cbb'] },
  { bin: '970414', name: 'MBV', aliases: ['mbv', 'oceanbank'] },
  { bin: '422589', name: 'CIMB', aliases: ['cimb', 'cimbbank'] },
  { bin: '546034', name: 'CAKE by VPBank', aliases: ['cake', 'cakebyvpbank'] },
  { bin: '546035', name: 'Ubank by VPBank', aliases: ['ubank', 'ubankbyvpbank'] },
  { bin: '963388', name: 'Timo', aliases: ['timo'] },
  { bin: '668888', name: 'KBank', aliases: ['kbank', 'kasikornbank'] },
] as const;

/** Bỏ dấu, viết thường, chỉ giữ chữ-số: "Ngân hàng MB Bank" → "nganhangmbbank". */
const squash = (value: string): string =>
  value
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/** Tên bỏ dấu, viết thường, các từ cách nhau một khoảng trắng. */
const tokens = (value: string): string[] =>
  value
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Alias ngắn (≤ 3 ký tự) chỉ khớp nguyên cụm, tránh "mb" khớp nhầm trong từ khác. */
const SHORT_ALIAS_MAX = 3;

/**
 * Tên ngân hàng nhân viên gõ tay ("MB", "Mbbank", "Quân Đội", "Vietcombank"…)
 * → thông tin ngân hàng. Trả null nếu không nhận ra, khi đó phải để nhân viên
 * tự chọn — không đoán, vì QR sai ngân hàng sẽ chuyển tiền nhầm chỗ.
 */
export const resolveBank = (text: string | undefined | null): BankInfo | null => {
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  const joined = squash(raw);
  const words = tokens(raw);

  // Alias dài trước để "vietcombank" thắng "bank"-kiểu khớp lỏng
  let best: { bank: BankInfo; length: number } | null = null;
  for (const bank of BANKS) {
    for (const alias of bank.aliases) {
      const matched =
        alias.length <= SHORT_ALIAS_MAX
          ? words.includes(alias) || joined === alias
          : joined.includes(alias);
      if (matched && (!best || alias.length > best.length)) {
        best = { bank, length: alias.length };
      }
    }
  }
  return best?.bank ?? null;
};

/** Danh sách để nhân viên tự chọn khi không nhận ra tên ngân hàng. */
export const BANK_OPTIONS: readonly { bin: string; name: string }[] = BANKS.map(
  ({ bin, name }) => ({ bin, name })
);

// ─── Nội dung chuyển khoản ────────────────────────────────────────────────────

/** Tách mã ký gửi thành các cụm chữ-số: "47-1126" → ["47", "1126"]. */
const codeParts = (consignmentCode: string): string[] =>
  consignmentCode
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

/** "47-1126" → "TRA 47 1126". */
export const buildPayContent = (consignmentCode: string): string =>
  `TRA ${codeParts(consignmentCode).join(' ')}`;

/**
 * Server chỉ tự đánh dấu "đã trả" khi mã có đủ 2 cụm (dạng "<số>-<mã nhóm>").
 * Mã chỉ một cụm vẫn tạo được QR, nhưng nhân viên phải bấm xác nhận tay.
 */
export const isAutoConfirmable = (consignmentCode: string): boolean =>
  codeParts(consignmentCode).length >= 2;

// ─── Chuỗi VietQR (EMVCo) ─────────────────────────────────────────────────────

const tlv = (id: string, value: string): string =>
  `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) theo chuẩn EMVCo. */
export const crc16 = (input: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/** Nội dung trong QR chỉ nhận ASCII chữ-số-khoảng trắng, tối đa 50 ký tự. */
const sanitizeContent = (content: string): string =>
  content
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);

export interface VietQrInput {
  bin: string;
  accountNumber: string;
  /** VND nguyên */
  amountVnd: number;
  content: string;
}

export type VietQrResult =
  | { ok: true; payload: string; content: string; accountNumber: string }
  | { ok: false; reason: string };

export const buildVietQr = (input: VietQrInput): VietQrResult => {
  const accountNumber = input.accountNumber.replace(/\s+/g, '');
  if (!/^\d{6,19}$/.test(accountNumber)) {
    return { ok: false, reason: 'Số tài khoản không hợp lệ (cần 6–19 chữ số).' };
  }
  if (!/^\d{6}$/.test(input.bin)) {
    return { ok: false, reason: 'Thiếu mã ngân hàng.' };
  }
  const amount = Math.round(input.amountVnd);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'Số tiền phải lớn hơn 0.' };
  }
  const content = sanitizeContent(input.content);

  const merchantAccount = tlv(
    '38',
    tlv('00', 'A000000727') +
      tlv('01', tlv('00', input.bin) + tlv('01', accountNumber)) +
      tlv('02', 'QRIBFTTA')
  );

  const body =
    tlv('00', '01') +
    tlv('01', '12') + // 12 = QR động (có số tiền)
    merchantAccount +
    tlv('53', '704') +
    tlv('54', String(amount)) +
    tlv('58', 'VN') +
    (content ? tlv('62', tlv('08', content)) : '') +
    '6304';

  return {
    ok: true,
    payload: body + crc16(body),
    content,
    accountNumber,
  };
};
