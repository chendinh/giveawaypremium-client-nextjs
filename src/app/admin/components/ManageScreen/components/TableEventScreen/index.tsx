'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────
interface EventItem {
  objectId: string;
  name: string;
  discountPercent: number;
  moneyBackPercent: number;
  [key: string]: any;
}

// ─── Component ────────────────────────────────────────
const TableEventScreen: React.FC = () => {
  const { eventsRedux, setEventsRedux } = useAppStore();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discountPercent: 0,
    moneyBackPercent: 0,
  });

  // ── Fetch events ──
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await GapService.getEvents();
      if (res?.results) {
        setEvents(res.results);
        setEventsRedux(res.results);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    setIsLoading(false);
  }, [setEventsRedux]);

  useEffect(() => {
    if (eventsRedux && eventsRedux.length > 0) {
      setEvents(eventsRedux);
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dialog handlers ──
  const openCreateDialog = () => {
    setEditingEvent(null);
    setFormData({ name: '', discountPercent: 0, moneyBackPercent: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (event: EventItem) => {
    setEditingEvent(event);
    setFormData({
      name: event.name || '',
      discountPercent: event.discountPercent || 0,
      moneyBackPercent: event.moneyBackPercent || 0,
    });
    setDialogOpen(true);
  };

  // ── Submit (create or update) ──
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sự kiện');
      return;
    }
    if (formData.discountPercent < 0 || formData.discountPercent > 100) {
      toast.error('% giảm giá phải từ 0 đến 100');
      return;
    }
    if (formData.moneyBackPercent < 0 || formData.moneyBackPercent > 100) {
      toast.error('% tiền ký gửi nhận được phải từ 0 đến 100');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        const res = await GapService.updateEvent(editingEvent.objectId, {
          name: formData.name,
          discountPercent: Number(formData.discountPercent),
          moneyBackPercent: Number(formData.moneyBackPercent),
        });
        if (res?.updatedAt) {
          toast.success('Cập nhật sự kiện thành công');
          setDialogOpen(false);
          fetchEvents();
        } else {
          toast.error('Cập nhật sự kiện thất bại');
        }
      } else {
        const res = await GapService.setEvent({
          name: formData.name,
          discountPercent: Number(formData.discountPercent),
          moneyBackPercent: Number(formData.moneyBackPercent),
        });
        if (res?.objectId) {
          toast.success('Tạo sự kiện thành công');
          setDialogOpen(false);
          fetchEvents();
        } else {
          toast.error('Tạo sự kiện thất bại');
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSubmitting(false);
  };

  // ── Delete ──
  const handleDelete = async (objectId: string) => {
    try {
      const res = await GapService.deleteEvent(objectId);
      if (res?.updatedAt) {
        toast.success('Xoá sự kiện thành công');
        fetchEvents();
      } else {
        toast.error('Xoá sự kiện thất bại');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quản lý Sự kiện</h3>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Thêm sự kiện
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Chưa có sự kiện nào
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Card key={event.objectId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{event.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(event)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(event.objectId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá:</span>
                  <span className="font-medium">
                    {event.discountPercent || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tiền ký gửi nhận được:
                  </span>
                  <span className="font-medium">
                    {event.moneyBackPercent || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên sự kiện</Label>
              <Input
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập tên sự kiện..."
              />
            </div>
            <div className="space-y-2">
              <Label>% Giảm giá bán hàng</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.discountPercent}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    discountPercent: Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>% Tiền ký gửi nhận được</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.moneyBackPercent}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    moneyBackPercent: Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : editingEvent ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableEventScreen;
