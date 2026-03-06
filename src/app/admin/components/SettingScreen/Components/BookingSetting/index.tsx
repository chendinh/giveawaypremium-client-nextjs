'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import {
  TIME_BOOKING,
  BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
} from '@/lib/constants';

import './style.scss';

interface TimeSlot {
  timeName: string;
  timeCode: string;
}

interface BookingOptionEachDay {
  [key: string]: string;
}

const DAYS_OF_WEEK = [
  { key: 'Sunday', label: 'CN' },
  { key: 'Monday', label: 'T2' },
  { key: 'Tuesday', label: 'T3' },
  { key: 'Wednesday', label: 'T4' },
  { key: 'Thursday', label: 'T5' },
  { key: 'Friday', label: 'T6' },
  { key: 'Saturday', label: 'T7' },
];

const BOOKING_OPTIONS = [
  { key: 'OPTION_1', label: 'Option 1 (Đóng)' },
  { key: 'OPTION_2', label: 'Option 2' },
  { key: 'OPTION_3', label: 'Option 3' },
  { key: 'OPTION_4', label: 'Option 4' },
  { key: 'OPTION_5', label: 'Option 5' },
  { key: 'OPTION_6', label: 'Option 6' },
  { key: 'OPTION_7', label: 'Option 7 (Đóng)' },
  { key: 'OPTION_8', label: 'Option 8 (Mặc định)' },
  { key: 'OPTION_9', label: 'Option 9' },
];

const BookingSetting: React.FC = () => {
  const { settings, setSettings, fetchSettings } = useAppStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [workingDayCount, setWorkingDayCount] = useState<number>(14);
  const [isShowBookingForm, setIsShowBookingForm] = useState<boolean>(true);
  const [isShowBookingOnlineForm, setIsShowBookingOnlineForm] =
    useState<boolean>(true);
  const [bookingOnlineAlert, setBookingOnlineAlert] = useState<string>('');
  const [bookingOptionEachDay, setBookingOptionEachDay] =
    useState<BookingOptionEachDay>(BOOKING_OPTION_EACH_DAY_DATA_DEFAULT);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settingData = await fetchSettings();
        if (settingData) {
          setWorkingDayCount(settingData.WORKING_DAY_COUNT || 14);
          setIsShowBookingForm(settingData.IS_SHOW_BOOKING_FORM === 'true');
          setIsShowBookingOnlineForm(
            settingData.IS_SHOW_BOOKING_ONLINE_FORM === 'true'
          );
          setBookingOnlineAlert(settingData.BOOKING_ONLINE_ALERT || '');
          if (settingData.BOOKING_OPTION_EACH_DAY) {
            setBookingOptionEachDay(settingData.BOOKING_OPTION_EACH_DAY);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        toast.error('Không thể tải cài đặt');
      }
      setIsLoading(false);
    };

    loadSettings();
  }, [fetchSettings]);

  const handleDayOptionChange = (
    dayKey: string,
    optionKey: string,
    checked: boolean
  ) => {
    const newOptions = { ...bookingOptionEachDay };

    // Remove day from all options first
    Object.keys(newOptions).forEach(key => {
      if (newOptions[key]?.includes(dayKey)) {
        newOptions[key] = newOptions[key]
          .replace(dayKey, '')
          .replace(',,', ',')
          .replace(/^,|,$/g, '');
      }
    });

    // Add day to selected option
    if (checked) {
      if (newOptions[optionKey]) {
        newOptions[optionKey] = newOptions[optionKey] + ',' + dayKey;
      } else {
        newOptions[optionKey] = dayKey;
      }
    }

    setBookingOptionEachDay(newOptions);
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      const settingObject = {
        ...settings,
        WORKING_DAY_COUNT: workingDayCount,
        IS_SHOW_BOOKING_FORM: isShowBookingForm ? 'true' : 'false',
        IS_SHOW_BOOKING_ONLINE_FORM: isShowBookingOnlineForm ? 'true' : 'false',
        BOOKING_ONLINE_ALERT: bookingOnlineAlert,
        BOOKING_OPTION_EACH_DAY: bookingOptionEachDay,
      };

      const res = await GapService.updateSetting(settingObject);
      if (res) {
        setSettings(settingObject);
        toast.success('Đã lưu cài đặt');
      } else {
        toast.error('Lưu cài đặt thất bại');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="booking-setting-container space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt chung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-booking">Hiển thị form đặt lịch</Label>
            <Switch
              id="show-booking"
              checked={isShowBookingForm}
              onCheckedChange={setIsShowBookingForm}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-booking-online">Mở ký gửi online</Label>
            <Switch
              id="show-booking-online"
              checked={isShowBookingOnlineForm}
              onCheckedChange={setIsShowBookingOnlineForm}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="working-days">Số ngày hiển thị</Label>
            <Input
              id="working-days"
              type="number"
              value={workingDayCount}
              onChange={e => setWorkingDayCount(Number(e.target.value))}
              className="w-24"
              min={1}
              max={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-online-alert">
              Thông báo đóng ký gửi online
            </Label>
            <Textarea
              id="booking-online-alert"
              value={bookingOnlineAlert}
              onChange={e => setBookingOnlineAlert(e.target.value)}
              placeholder="Nhập thông báo khi đóng ký gửi online..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      {/* Time Slots Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Xem trước khung giờ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOOKING_OPTIONS.filter(
              opt => opt.key !== 'OPTION_1' && opt.key !== 'OPTION_7'
            ).map(opt => {
              const timeSlots =
                TIME_BOOKING[opt.key as keyof typeof TIME_BOOKING] || [];
              return (
                <div key={opt.key} className="border rounded p-3">
                  <h4 className="font-medium mb-2">{opt.label}</h4>
                  <div className="flex flex-wrap gap-1">
                    {timeSlots.map((slot: TimeSlot) => (
                      <span
                        key={slot.timeCode}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {slot.timeName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Lưu cài đặt
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BookingSetting;
