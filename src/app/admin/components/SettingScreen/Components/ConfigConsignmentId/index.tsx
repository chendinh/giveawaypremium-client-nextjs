'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import moment from 'moment';

import GapService from '@/app/actions/GapServices';

import './style.scss';

interface TagItem {
  objectId: string;
  code: string;
  timeGetMoney: string;
  createdAt?: string;
}

interface FormData {
  code: string;
  timeGetMoney: string;
}

const ConfigConsignmentId: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [allInfoTag, setAllInfoTag] = useState<TagItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    timeGetMoney: '',
  });

  const fetchAllTags = async () => {
    setIsLoading(true);
    try {
      const res = await GapService.getConsignmentID();
      if (res?.results?.length > 0) {
        setAllInfoTag([...res.results].reverse());
      } else {
        setAllInfoTag([]);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      toast.error('Không thể tải danh sách đợt ký gửi');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllTags();
  }, []);

  const openAddModal = () => {
    setFormData({
      code: '',
      timeGetMoney: moment().add(14, 'days').format('YYYY-MM-DD'),
    });
    setIsModalOpen(true);
  };

  const handleAddTag = async () => {
    if (!formData.code || !formData.timeGetMoney) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsSaving(true);
    try {
      const tagData = {
        code: formData.code,
        timeGetMoney: moment(formData.timeGetMoney).toISOString(),
      };

      const res = await GapService.setConsignmentID(tagData);
      if (res?.objectId) {
        toast.success('Đã thêm đợt ký gửi mới');
        setIsModalOpen(false);
        fetchAllTags();
      } else {
        toast.error('Thêm đợt ký gửi thất bại');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  const openDeleteDialog = (tag: TagItem) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    setIsSaving(true);
    try {
      const res = await GapService.deleteConsignmentID(selectedTag.objectId);
      if (res) {
        toast.success('Đã xoá đợt ký gửi');
        setDeleteDialogOpen(false);
        setSelectedTag(null);
        fetchAllTags();
      } else {
        toast.error('Xoá đợt ký gửi thất bại');
      }
    } catch (err) {
      console.error('Error deleting tag:', err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  return (
    <div className="config-consignment-container">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách đợt ký gửi</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllTags}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Mã đợt</TableHead>
                  <TableHead>Ngày trả tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInfoTag.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Chưa có đợt ký gửi nào
                    </TableCell>
                  </TableRow>
                ) : (
                  allInfoTag.map((tag, index) => (
                    <TableRow key={tag.objectId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{tag.code}</TableCell>
                      <TableCell>
                        {moment(tag.timeGetMoney).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        {tag.createdAt
                          ? moment(tag.createdAt).format('DD/MM/YYYY HH:mm')
                          : '---'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(tag)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm đợt ký gửi mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã đợt</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={e =>
                  setFormData(prev => ({ ...prev, code: e.target.value }))
                }
                placeholder="VD: T1-2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeGetMoney">Ngày trả tiền</Label>
              <Input
                id="timeGetMoney"
                type="date"
                value={formData.timeGetMoney}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    timeGetMoney: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleAddTag} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Thêm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá đợt ký gửi "{selectedTag?.code}"? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSaving ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfigConsignmentId;
