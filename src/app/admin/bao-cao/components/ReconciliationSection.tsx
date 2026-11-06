'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Loader2,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';

import GapService from '@/app/actions/GapServices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import {
  formatDate,
  formatDateTime,
  formatSignedVnd,
  formatVnd,
  numberWithCommas,
} from '../format';
import {
  MonthlyReport,
  ReconOrderItem,
  ReconPayoutItem,
  ReconSideSummary,
  ReconTx,
  SyncResult,
} from '../types';
import LinkTransactionDialog, { LinkCandidate } from './LinkTransactionDialog';
import ReasonDialog from './ReasonDialog';
import { ReportSection, StatusBadge } from './ReportSection';

const CELL = 'px-2 py-1.5 text-xs align-top';
const NUM = `${CELL} text-right tabular-nums whitespace-nowrap`;
const HEAD_ROW = 'bg-gray-50 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs';

const ManualBadge: React.FC = () => (
  <Badge
    variant="outline"
    className="ml-1 border-purple-200 font-normal text-purple-700"
  >
    gán tay
  </Badge>
);

// ─── Khối tóm tắt cho một chiều (tiền vào / tiền ra) ──────────────────────────

interface Metric {
  label: string;
  value: string;
  hint?: string;
  bad?: boolean;
}

const SidePanel: React.FC<{
  title: string;
  subtitle: string;
  summary: ReconSideSummary;
  direction: 'in' | 'out';
}> = ({ title, subtitle, summary, direction }) => {
  const metrics: Metric[] = [
    {
      label:
        direction === 'in' ? 'Cần có (đơn thu CK)' : 'Cần chi (ký gửi trả CK)',
      value: formatVnd(summary.expectedVnd),
    },
    {
      label: 'Ngân hàng đã khớp',
      value: formatVnd(summary.allocatedVnd),
    },
    {
      label:
        direction === 'in'
          ? 'Đơn chưa thấy tiền về'
          : 'Ký gửi chưa thấy tiền chuyển ra',
      value: `${summary.missingCount} · ${formatVnd(summary.missingVnd)}`,
      bad: summary.missingCount > 0,
    },
    {
      label: 'Đã có giao dịch nhưng lệch tiền',
      value: `${summary.mismatchCount}`,
      hint:
        summary.mismatchCount > 0
          ? `thiếu ${formatVnd(summary.shortVnd)} · thừa ${formatVnd(summary.excessVnd)}`
          : undefined,
      bad: summary.mismatchCount > 0,
    },
    {
      label: 'Giao dịch ngân hàng chưa khớp',
      value: `${summary.unmatchedTxCount} · ${formatVnd(summary.unmatchedTxVnd)}`,
      bad: summary.unmatchedTxCount > 0,
    },
    {
      label:
        direction === 'in'
          ? 'Tổng tiền vào ngân hàng'
          : 'Tổng tiền ra ngân hàng',
      value: formatVnd(summary.bankTotalVnd),
      hint: `${summary.bankCount} giao dịch trong tháng`,
    },
  ];

  return (
    <div className="break-inside-avoid rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {metrics.map(metric => (
          <div key={metric.label}>
            <dt className="text-xs text-muted-foreground">{metric.label}</dt>
            <dd
              className={cn(
                'font-semibold tabular-nums',
                metric.bad && 'text-red-600'
              )}
            >
              {metric.value}
            </dd>
            {metric.hint && (
              <dd className="text-xs text-muted-foreground">{metric.hint}</dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
};

// ─── Bảng giao dịch ngân hàng ─────────────────────────────────────────────────

const TxTable: React.FC<{
  title: string;
  emptyText: string;
  transactions: ReconTx[];
  onLink: (tx: ReconTx) => void;
  onUnlink: (tx: ReconTx) => void;
}> = ({ title, emptyText, transactions, onLink, onUnlink }) => (
  <div className="break-inside-avoid-page">
    <p className="mb-1 text-sm font-semibold">{title}</p>
    <div className="max-h-[420px] overflow-y-auto rounded-lg border print:max-h-none print:overflow-visible">
      <Table>
        <TableHeader>
          <TableRow className={HEAD_ROW}>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead>Nội dung chuyển khoản</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Khớp với / giải trình</TableHead>
            <TableHead className="print:hidden" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {transactions.map(tx => (
            <TableRow key={tx.id} className="break-inside-avoid">
              <TableCell className={`${CELL} whitespace-nowrap`}>
                {formatDateTime(tx.at)}
              </TableCell>
              <TableCell className={`${NUM} font-medium`}>
                {formatVnd(tx.amountVnd)}
              </TableCell>
              <TableCell className={`${CELL} max-w-[280px] break-words`}>
                {tx.content || '—'}
                {tx.referenceCode && (
                  <span className="block text-muted-foreground">
                    Mã GD: {tx.referenceCode}
                  </span>
                )}
              </TableCell>
              <TableCell className={CELL}>
                <StatusBadge status={tx.status} />
                {tx.source === 'manual' && <ManualBadge />}
              </TableCell>
              <TableCell className={`${CELL} max-w-[260px] break-words`}>
                {tx.targets.map(t => (
                  <div key={t.id}>
                    {t.label}
                    {tx.targets.length > 1 && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({formatVnd(t.amountVnd)})
                      </span>
                    )}
                  </div>
                ))}
                {tx.explanation && (
                  <div className="italic">“{tx.explanation}”</div>
                )}
                {tx.source === 'manual' && tx.linkedByName && (
                  <div className="text-muted-foreground">
                    {tx.linkedByName}
                    {tx.linkedAt ? ` · ${formatDateTime(tx.linkedAt)}` : ''}
                  </div>
                )}
              </TableCell>
              <TableCell
                className={`${CELL} whitespace-nowrap text-right print:hidden`}
              >
                {tx.source === 'manual' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onUnlink(tx)}
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Hủy gán
                  </Button>
                ) : tx.status === 'unmatched' || tx.status === 'mismatch' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onLink(tx)}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Gán / giải trình
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

// ─── Bảng đơn / ký gửi cần chú ý ──────────────────────────────────────────────

const diffCell = (diffVnd: number, status: string): React.ReactNode =>
  status === 'matched' ? (
    <span className="text-muted-foreground">0đ</span>
  ) : (
    <span className={diffVnd < 0 ? 'text-red-600' : 'text-amber-700'}>
      {formatSignedVnd(diffVnd)}
    </span>
  );

const OrderItemsTable: React.FC<{ items: ReconOrderItem[] }> = ({ items }) => (
  <div className="break-inside-avoid-page">
    <p className="mb-1 text-sm font-semibold">
      Đơn ghi nhận thu chuyển khoản nhưng chưa khớp tiền về ngân hàng
    </p>
    <div className="max-h-[420px] overflow-y-auto rounded-lg border print:max-h-none print:overflow-visible">
      <Table>
        <TableHeader>
          <TableRow className={HEAD_ROW}>
            <TableHead>Thời gian đơn</TableHead>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Nhân viên</TableHead>
            <TableHead className="text-right">Ghi nhận CK</TableHead>
            <TableHead className="text-right">Ngân hàng</TableHead>
            <TableHead className="text-right">Chênh lệch</TableHead>
            <TableHead>NV đã bấm “nhận tiền”</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                Mọi đơn thu chuyển khoản đều có tiền về khớp.
              </TableCell>
            </TableRow>
          )}
          {items.map(item => (
            <TableRow key={item.id} className="break-inside-avoid">
              <TableCell className={`${CELL} whitespace-nowrap`}>
                {formatDateTime(item.at)}
              </TableCell>
              <TableCell className={`${CELL} font-mono`}>{item.id}</TableCell>
              <TableCell className={CELL}>
                {item.customerName || '—'}
                <span className="block text-muted-foreground">
                  {item.phone}
                </span>
              </TableCell>
              <TableCell className={CELL}>{item.staffName || '—'}</TableCell>
              <TableCell className={NUM}>
                {formatVnd(item.expectedVnd)}
              </TableCell>
              <TableCell className={NUM}>
                {formatVnd(item.allocatedVnd)}
              </TableCell>
              <TableCell className={NUM}>
                {diffCell(item.diffVnd, item.status)}
              </TableCell>
              <TableCell className={CELL}>
                {item.moneyConfirmed === null
                  ? '—'
                  : item.moneyConfirmed
                    ? 'Đã bấm'
                    : 'Chưa'}
              </TableCell>
              <TableCell className={`${CELL} whitespace-nowrap`}>
                <StatusBadge status={item.status} />
                {item.source === 'manual' && <ManualBadge />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

const PayoutItemsTable: React.FC<{ items: ReconPayoutItem[] }> = ({
  items,
}) => (
  <div className="break-inside-avoid-page">
    <p className="mb-1 text-sm font-semibold">
      Ký gửi đã đánh dấu trả bằng chuyển khoản nhưng chưa khớp tiền chuyển ra
    </p>
    <div className="max-h-[420px] overflow-y-auto rounded-lg border print:max-h-none print:overflow-visible">
      <Table>
        <TableHeader>
          <TableRow className={HEAD_ROW}>
            <TableHead>Ngày xác nhận trả</TableHead>
            <TableHead>Mã ký gửi</TableHead>
            <TableHead>Khách ký gửi</TableHead>
            <TableHead>Tài khoản nhận</TableHead>
            <TableHead className="text-right">Cần chuyển</TableHead>
            <TableHead className="text-right">Ngân hàng đã chi</TableHead>
            <TableHead className="text-right">Chênh lệch</TableHead>
            <TableHead>NV xác nhận</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                Mọi khoản trả khách bằng chuyển khoản đều có giao dịch chi khớp.
              </TableCell>
            </TableRow>
          )}
          {items.map(item => (
            <TableRow key={item.id} className="break-inside-avoid">
              <TableCell className={`${CELL} whitespace-nowrap`}>
                {formatDateTime(item.paidAt)}
              </TableCell>
              <TableCell className={`${CELL} font-mono`}>
                {item.consignmentId}
              </TableCell>
              <TableCell className={CELL}>
                {item.consignerName || '—'}
              </TableCell>
              <TableCell className={CELL}>
                {item.bankName || '—'}
                <span className="ml-1 text-muted-foreground">
                  {item.accountMasked}
                </span>
              </TableCell>
              <TableCell className={NUM}>
                {formatVnd(item.expectedVnd)}
              </TableCell>
              <TableCell className={NUM}>
                {formatVnd(item.allocatedVnd)}
              </TableCell>
              <TableCell className={NUM}>
                {diffCell(item.diffVnd, item.status)}
              </TableCell>
              <TableCell className={CELL}>{item.markedBy || '—'}</TableCell>
              <TableCell className={`${CELL} whitespace-nowrap`}>
                <StatusBadge status={item.status} />
                {item.source === 'manual' && <ManualBadge />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

// ─── Section ──────────────────────────────────────────────────────────────────

interface Props {
  report: MonthlyReport;
  /** Tải lại báo cáo sau khi đồng bộ / gán / huỷ gán */
  onChanged: () => Promise<void> | void;
}

const ReconciliationSection: React.FC<Props> = ({ report, onChanged }) => {
  const { reconciliation } = report;
  const { inbound, outbound } = reconciliation;

  const [syncing, setSyncing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [linkTx, setLinkTx] = useState<ReconTx | null>(null);
  const [unlinkTx, setUnlinkTx] = useState<ReconTx | null>(null);

  const webhookUrl = `${(process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/parse\/?$/, '')}/hooks/sepay`;

  const needsAttention = <T extends { status: string; source: string | null }>(
    entry: T
  ): boolean => entry.status !== 'matched' || entry.source === 'manual';

  const inItems = useMemo(
    () => (inbound?.items ?? []).filter(needsAttention),
    [inbound]
  );
  const outItems = useMemo(
    () => (outbound?.items ?? []).filter(needsAttention),
    [outbound]
  );
  const inTxs = useMemo(
    () =>
      (inbound?.transactions ?? []).filter(
        tx => tx.inMonth && (showAll || needsAttention(tx))
      ),
    [inbound, showAll]
  );
  const outTxs = useMemo(
    () =>
      (outbound?.transactions ?? []).filter(
        tx => tx.inMonth && (showAll || needsAttention(tx))
      ),
    [outbound, showAll]
  );

  const issueCount = useMemo(() => {
    const count = (s?: ReconSideSummary) =>
      s ? s.missingCount + s.mismatchCount + s.unmatchedTxCount : 0;
    return count(inbound?.summary) + count(outbound?.summary);
  }, [inbound, outbound]);

  const candidates = useMemo<LinkCandidate[]>(() => {
    if (!linkTx) return [];
    if (linkTx.type === 'in') {
      return (inbound?.items ?? [])
        .filter(item => item.status !== 'matched')
        .map(item => ({
          id: item.id,
          type: 'order' as const,
          title: `Đơn ${item.id} · ${item.customerName || 'Khách lẻ'}`,
          subtitle: [
            formatDate(item.at),
            item.phone,
            item.allocatedVnd > 0
              ? `đã khớp ${formatVnd(item.allocatedVnd)}`
              : '',
          ]
            .filter(Boolean)
            .join(' · '),
          expectedVnd: item.expectedVnd,
          atMs: new Date(item.at).getTime(),
        }));
    }
    return (outbound?.items ?? [])
      .filter(item => item.status !== 'matched')
      .map(item => ({
        id: item.id,
        type: 'consignment' as const,
        title: `Ký gửi ${item.consignmentId} · ${item.consignerName || '—'}`,
        subtitle: [
          `xác nhận trả ${formatDate(item.paidAt)}`,
          item.allocatedVnd > 0
            ? `đã khớp ${formatVnd(item.allocatedVnd)}`
            : '',
        ]
          .filter(Boolean)
          .join(' · '),
        expectedVnd: item.expectedVnd,
        atMs: new Date(item.paidAt).getTime(),
      }));
  }, [linkTx, inbound, outbound]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await GapService.syncSepayTransactions(report.month);
      if (res?.result) {
        const result = res.result as SyncResult;
        toast.success(
          `Đồng bộ xong: thêm ${result.inserted} giao dịch mới, ${result.existing} giao dịch đã có sẵn`
        );
        await onChanged();
      } else {
        toast.error(res?.error || 'Không đồng bộ được từ SePay');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleLink = async (payload: {
    targets: Array<{ type: 'order' | 'consignment'; id: string }>;
    note: string;
  }) => {
    if (!linkTx) return;
    const res = await GapService.linkBankTransaction({
      transactionId: linkTx.id,
      targets: payload.targets,
      note: payload.note,
    });
    if (!res?.result?.ok) {
      toast.error(res?.error || 'Không lưu được');
      throw new Error('link failed');
    }
    toast.success('Đã lưu');
    setLinkTx(null);
    await onChanged();
  };

  const handleUnlink = async (reason: string) => {
    if (!unlinkTx) return;
    const res = await GapService.unlinkBankTransaction(unlinkTx.id, reason);
    if (!res?.result?.ok) {
      toast.error(res?.error || 'Không huỷ gán được');
      throw new Error('unlink failed');
    }
    toast.success('Đã huỷ gán');
    setUnlinkTx(null);
    await onChanged();
  };

  const syncButton = reconciliation.configured.api && (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      {syncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Đồng bộ từ SePay
    </Button>
  );

  return (
    <ReportSection
      id="doi-chieu"
      title="4. Đối chiếu với sao kê ngân hàng (SePay)"
      description="Tiền khách chuyển vào ↔ đơn hàng, tiền chuyển ra ↔ ký gửi đã trả. Dữ liệu ngân hàng do SePay lấy trực tiếp từ ngân hàng, nhân viên không sửa được."
      actions={
        <>
          {reconciliation.hasData && (
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
              />
              Hiện cả giao dịch đã khớp
            </label>
          )}
          {syncButton}
        </>
      }
    >
      {reconciliation.error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {reconciliation.error}
        </div>
      )}

      {!reconciliation.hasData && !reconciliation.error && (
        <div className="rounded-lg border border-dashed p-6 text-sm">
          <p className="font-medium">
            Chưa có dữ liệu ngân hàng cho tháng này, nên chưa đối chiếu được.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Webhook SePay:{' '}
              <strong>
                {reconciliation.configured.webhook
                  ? 'server đã có khoá xác thực'
                  : 'server chưa cấu hình khoá xác thực'}
              </strong>
              . Khai báo URL{' '}
              <code className="rounded bg-gray-100 px-1">{webhookUrl}</code> tại
              my.sepay.vn → Webhooks (chọn “Cả hai” để nhận tiền vào và tiền
              ra).
            </li>
            <li>
              Lấy lại giao dịch đã qua (webhook chỉ gửi giao dịch phát sinh sau
              khi bật):{' '}
              <strong>
                {reconciliation.configured.api
                  ? 'bấm “Đồng bộ từ SePay”'
                  : 'cần cấu hình SEPAY_API_TOKEN trên server'}
              </strong>
              .
            </li>
          </ul>
        </div>
      )}

      {reconciliation.hasData && inbound && outbound && (
        <div className="space-y-5">
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border p-3 text-sm',
              issueCount === 0
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-amber-300 bg-amber-50 text-amber-900'
            )}
          >
            {issueCount === 0 ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>
              {issueCount === 0
                ? 'Không phát hiện chênh lệch giữa dữ liệu hệ thống và sao kê ngân hàng.'
                : `Có ${numberWithCommas(issueCount)} mục cần giải trình (đơn/ký gửi thiếu hoặc lệch tiền, giao dịch ngân hàng chưa khớp).`}
              {reconciliation.lastTransactionAt && (
                <span className="block text-xs opacity-80">
                  Giao dịch ngân hàng mới nhất đã nhận:{' '}
                  {formatDateTime(reconciliation.lastTransactionAt)}
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SidePanel
              title="Tiền vào ↔ đơn hàng thu chuyển khoản"
              subtitle="Khách chuyển khoản mua hàng"
              summary={inbound.summary}
              direction="in"
            />
            <SidePanel
              title="Tiền ra ↔ ký gửi đã trả bằng chuyển khoản"
              subtitle="Shop chuyển tiền trả khách ký gửi"
              summary={outbound.summary}
              direction="out"
            />
          </div>

          <OrderItemsTable items={inItems} />
          <TxTable
            title="Tiền vào ngân hàng"
            emptyText="Mọi giao dịch tiền vào đều đã khớp với đơn hàng."
            transactions={inTxs}
            onLink={setLinkTx}
            onUnlink={setUnlinkTx}
          />
          <PayoutItemsTable items={outItems} />
          <TxTable
            title="Tiền ra ngân hàng"
            emptyText="Mọi giao dịch tiền ra đều đã khớp với ký gửi."
            transactions={outTxs}
            onLink={setLinkTx}
            onUnlink={setUnlinkTx}
          />
        </div>
      )}

      {linkTx && (
        <LinkTransactionDialog
          key={linkTx.id}
          tx={linkTx}
          candidates={candidates}
          onSubmit={handleLink}
          onClose={() => setLinkTx(null)}
        />
      )}
      {unlinkTx && (
        <ReasonDialog
          key={unlinkTx.id}
          title="Huỷ gán / giải trình giao dịch"
          description="Giao dịch sẽ quay lại trạng thái chưa khớp. Lý do huỷ được lưu vết."
          placeholder="Lý do huỷ gán..."
          confirmLabel="Huỷ gán"
          onConfirm={handleUnlink}
          onClose={() => setUnlinkTx(null)}
        />
      )}
    </ReportSection>
  );
};

export default ReconciliationSection;
