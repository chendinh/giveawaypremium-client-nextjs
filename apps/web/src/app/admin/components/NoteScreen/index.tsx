'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import moment from 'moment';

import GapService from '@/app/actions/GapServices';

import './style.scss';

// ─── Types ────────────────────────────────────────────
interface NoteItem {
  objectId: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Component ────────────────────────────────────────
const NoteScreen: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const limit = 20;

  // ─── Fetch Notes ────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await GapService.getNotes(page, limit);
      if (result?.results) {
        setNotes(result.results);
        setTotalNotes(result.count || result.results.length);
      } else {
        setNotes([]);
        setTotalNotes(0);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      toast.error('Lỗi khi tải ghi chú');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ─── Create / Update ───────────────────────────────
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setShowDialog(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setIsEditing(true);
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingNote) {
        await GapService.updateNote(editingNote.objectId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
        });
        toast.success('Cập nhật ghi chú thành công');
      } else {
        await GapService.createNote({
          title: formData.title.trim(),
          content: formData.content.trim(),
        });
        toast.success('Tạo ghi chú thành công');
      }
      setShowDialog(false);
      setFormData({ title: '', content: '' });
      fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
      toast.error('Lỗi khi lưu ghi chú');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await GapService.deleteNote(deleteId);
      toast.success('Đã xoá ghi chú');
      setDeleteId(null);
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Lỗi khi xoá ghi chú');
    }
  };

  // ─── Pagination ─────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalNotes / limit));

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="note-screen-container p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Ghi Chú ({totalNotes})
        </h2>
        <div className="flex gap-2">
          <Button onClick={fetchNotes} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải lại
          </Button>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tạo mới
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <StickyNote className="h-12 w-12 mb-4" />
          <p>Chưa có ghi chú nào</p>
          <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Tạo ghi chú đầu tiên
          </Button>
        </div>
      ) : (
        <>
          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <Card key={note.objectId} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold line-clamp-1">
                    {note.title || 'Không có tiêu đề'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {note.createdAt
                      ? moment(note.createdAt).format('DD/MM/YYYY HH:mm')
                      : ''}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                    {note.content || ''}
                  </p>
                </CardContent>
                <div className="flex justify-end gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(note)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(note.objectId)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Xoá
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Sửa ghi chú' : 'Tạo ghi chú mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Tiêu đề</Label>
              <Input
                id="note-title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Nhập tiêu đề..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Nội dung</Label>
              <Textarea
                id="note-content"
                value={formData.content}
                onChange={e =>
                  setFormData(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="Nhập nội dung ghi chú..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSaving}
            >
              Huỷ
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá ghi chú này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NoteScreen;
