'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface EmailItem {
  key: number;
  objectId: string;
  content: string;
  name: string;
}

interface EmailApiItem {
  objectId: string;
  content: string;
  key: string;
}

// ─── Component ────────────────────────────────────────
const TableEmailScreen: React.FC = () => {
  const { userData } = useAppStore();

  // Data
  const [dataSource, setDataSource] = useState<EmailItem[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 100;

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<EmailItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── Fetch email templates ──
  const fetchEmailData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await GapService.getEmailTable(page);

      if (res?.results) {
        const emails: EmailItem[] = res.results.map(
          (item: EmailApiItem, index: number) => ({
            key: index,
            objectId: item.objectId,
            content: item.content,
            name: item.key,
          })
        );
        setDataSource(emails);
        setTotalCount(res.count || emails.length);
      } else {
        setDataSource([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error fetching email templates:', err);
      toast.error('Không thể tải dữ liệu');
    }
    setIsLoading(false);
  }, []);

  // ── Init ──
  useEffect(() => {
    fetchEmailData(1);
  }, [fetchEmailData]);

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEmailData(page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Edit ──
  const openEditModal = (item: EmailItem) => {
    setEditingItem({ ...item });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await GapService.updateEmailTable(
        editingItem.objectId,
        editingItem.content
      );
      if (res) {
        toast.success(`Cập nhật thành công ${editingItem.name}`);
        setEditModalOpen(false);
        setEditingItem(null);
        fetchEmailData(currentPage);
      } else {
        toast.error('Cập nhật chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  // ── Render ──
  return (
    <div className="table-email-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchEmailData(currentPage)}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
          />
          Làm mới
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          Tổng: {numberWithCommas(totalCount)} email templates
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">KEY</TableHead>
              <TableHead className="w-[500px]">HTML</TableHead>
              <TableHead className="w-[500px]">RENDER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              dataSource.map((item) => (
                <TableRow key={item.objectId}>
                  <TableCell className="text-sm font-medium align-top">
                    {item.name || '---'}
                  </TableCell>
                  <TableCell
                    className="text-xs align-top cursor-pointer hover:bg-muted/50 max-w-[500px]"
                    onClick={() => openEditModal(item)}
                    title="Nhấn để chỉnh sửa"
                  >
                    <div className="flex items-start gap-1">
                      <Edit className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                      <pre className="whitespace-pre-wrap break-all text-xs font-mono max-h-[200px] overflow-y-auto">
                        {item.content || '---'}
                      </pre>
                    </div>
                  </TableCell>
                  <TableCell className="align-top max-w-[500px]">
                    {item.content ? (
                      <div
                        className="prose prose-sm max-h-[200px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa email template: {editingItem?.name}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs">HTML Content</Label>
                <Textarea
                  className="min-h-[40vh] font-mono text-xs"
                  value={editingItem.content || ''}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, content: e.target.value } : null
                    )
                  }
                />
              </div>

              {/* Live preview */}
              <div className="space-y-1">
                <Label className="text-xs">Preview</Label>
                <div
                  className="border rounded-md p-3 prose prose-sm max-h-[30vh] overflow-y-auto bg-white"
                  dangerouslySetInnerHTML={{
                    __html: editingItem.content || '',
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableEmailScreen;
