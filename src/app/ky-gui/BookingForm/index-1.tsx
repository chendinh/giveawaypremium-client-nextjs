// app/consignment/components/BookingForm.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Giả lập constants (thay bằng import thực tế)
const TIME_BOOKING = {
  OPTION_8: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '11:00', timeCode: '1100' },
    { timeName: '13:30', timeCode: '1330' },
    { timeName: '14:30', timeCode: '1430' },
    { timeName: '15:30', timeCode: '1530' },
    { timeName: '16:30', timeCode: '1630' },
    { timeName: '17:30', timeCode: '1730' },
    { timeName: '18:30', timeCode: '1830' },
  ],
  // Thêm các OPTION khác nếu cần
};

// Schema validation
const formSchema = z.object({
  customerName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phoneNumber: z
    .string()
    .regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (10 số bắt đầu bằng 0)'),
  numberOfProduct: z
    .number()
    .min(5, 'Tối thiểu 5 món')
    .max(50, 'Tối đa 50 món - liên hệ hotline nếu >50'),
  dayTime: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BookingForm({ backConsignment }) {
  const [workingDayCount] = useState(14);
  const [dayBooking, setDayBooking] = useState<
    { dayName: string; date: string; dayCode: string }[]
  >([]);
  const [timeBooking, setTimeBooking] = useState<
    { timeName: string; timeCode: string }[]
  >(TIME_BOOKING.OPTION_8);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    addDays(new Date(), 0)
  );
  const [selectedTimeCode, setSelectedTimeCode] = useState<string | null>(null);
  const [busySlots, setBusySlots] = useState<string[]>([]); // e.g. "1000DDMMYYYY"
  const [step, setStep] = useState(0); // 0: chọn ngày/giờ, 1: form info, 2: success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorSlotInfo, setErrorSlotInfo] = useState<{
    customerName: string;
    dateTime: string;
    date: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      numberOfProduct: 5,
      dayTime: '',
    },
  });

  // Generate days
  useEffect(() => {
    const days = Array.from({ length: workingDayCount }, (_, i) => {
      const date = addDays(new Date(), i);
      return {
        dayName: format(date, 'EEEE', { locale: vi }),
        date: format(date, 'dd-MM-yyyy'),
        dayCode: format(date, 'ddMMyyyy'),
      };
    });
    setDayBooking(days);
  }, [workingDayCount]);

  // Fetch busy slots (giả lập API call)
  const fetchAppointment = async () => {
    // Thay bằng real API: GapService.getAppointmentWithDate(...)
    // Ví dụ mock:
    const mockBusy = ['100008012025', '133008012025']; // 10:00 & 13:30 ngày 08/01/2025
    setBusySlots(mockBusy);
  };

  useEffect(() => {
    fetchAppointment();
  }, []);

  // Update time slots dựa trên ngày (nếu có option khác nhau)
  const availableTimes = useMemo(() => {
    return timeBooking.map(slot => {
      const slotId =
        slot.timeCode + (selectedDate ? format(selectedDate, 'ddMMyyyy') : '');
      const isBusy = busySlots.includes(slotId);
      return { ...slot, isBusy };
    });
  }, [timeBooking, selectedDate, busySlots]);

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeCode(null);
    setStep(0);
  };

  const handleSelectTime = (timeCode: string) => {
    setSelectedTimeCode(timeCode);
    setStep(1);
  };

  const handleSubmit = async (values: FormData) => {
    if (!selectedDate || !selectedTimeCode) return;

    setIsSubmitting(true);
    setErrorSlotInfo(null);

    const dateStr = format(selectedDate, 'dd-MM-yyyy');
    const timeStr =
      selectedTimeCode.slice(0, 2) + ':' + selectedTimeCode.slice(2);
    const slotID = selectedTimeCode + format(selectedDate, 'ddMMyyyy');

    try {
      // Thay bằng real API: GapService.setAppointment(...)
      // Kiểm tra phone duplicate trước nếu cần
      // const resPhone = await GapService.getAppointmentWithPhone(values.phoneNumber);
      // ... logic check exist

      // Giả lập success
      toast.success('Đặt lịch thành công!');
      setStep(2);
    } catch (err) {
      toast.error('Đặt lịch thất bại. Vui lòng thử lại.');
      await fetchAppointment(); // refresh busy slots
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertToDisplayTime = () => {
    if (!selectedDate || !selectedTimeCode) return '---';
    return `${format(selectedDate, 'dd-MM-yyyy')} ${selectedTimeCode.slice(0, 2)}:${selectedTimeCode.slice(2)}`;
  };

  const translationDay = (day: string) => {
    const map: Record<string, string> = {
      Sunday: 'Chủ Nhật',
      Monday: 'Thứ Hai',
      Tuesday: 'Thứ Ba',
      Wednesday: 'Thứ Tư',
      Thursday: 'Thứ Năm',
      Friday: 'Thứ Sáu',
      Saturday: 'Thứ Bảy',
    };
    return map[day] || day;
  };

  if (step === 2) {
    return (
      <Card className="max-w-2xl mx-auto text-center p-8">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-6">Đặt lịch ký gửi thành công!</h2>
        <div className="text-left space-y-4 mb-8">
          <p>
            <strong>Thời gian:</strong> {convertToDisplayTime()}
          </p>
          <p>
            <strong>Tên:</strong> {form.getValues('customerName')}
          </p>
          <p>
            <strong>SĐT:</strong> {form.getValues('phoneNumber')}
          </p>
          <p>
            <strong>Số lượng:</strong> {form.getValues('numberOfProduct')} món
          </p>
        </div>
        <Button onClick={backConsignment} variant="outline" className="mt-4">
          Quay lại trang chính
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar chọn ngày */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn ngày ký gửi</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={date =>
                date < new Date() ||
                date > addDays(new Date(), workingDayCount - 1)
              }
              locale={vi}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time slots */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn khung giờ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {availableTimes.map(slot => (
                <Button
                  key={slot.timeCode}
                  variant={
                    selectedTimeCode === slot.timeCode ? 'default' : 'outline'
                  }
                  disabled={slot.isBusy}
                  onClick={() =>
                    !slot.isBusy && handleSelectTime(slot.timeCode)
                  }
                  className={cn(
                    slot.isBusy && 'opacity-50 cursor-not-allowed bg-red-50',
                    selectedTimeCode === slot.timeCode &&
                      'bg-indigo-600 text-white'
                  )}
                >
                  {slot.timeName}
                </Button>
              ))}
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                Đã đặt chỗ
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded" />
                Còn trống
              </div>
            </div>

            {selectedTimeCode && (
              <Button onClick={() => setStep(1)} className="w-full">
                Tiếp tục điền thông tin <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form thông tin */}
      {step === 1 && (
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Thông tin đặt lịch</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div>
                <Label>Thời gian đã chọn</Label>
                <Input
                  value={convertToDisplayTime()}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="customerName">Họ và Tên</Label>
                <Input
                  id="customerName"
                  {...form.register('customerName')}
                  className="mt-1"
                />
                {form.formState.errors.customerName && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...form.register('phoneNumber')}
                  className="mt-1"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numberOfProduct">Số lượng hàng hoá</Label>
                <Input
                  id="numberOfProduct"
                  type="number"
                  {...form.register('numberOfProduct', { valueAsNumber: true })}
                  className="mt-1"
                />
                {form.formState.errors.numberOfProduct && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.numberOfProduct.message}
                  </p>
                )}
                {form.watch('numberOfProduct') > 50 && (
                  <p className="text-sm text-amber-600 mt-1">
                    {`Số lượng >50 vui lòng liên hệ hotline 0703 334 443`}
                  </p>
                )}
              </div>

              {errorSlotInfo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  Khách hàng {errorSlotInfo.customerName} đã đặt lịch{' '}
                  {errorSlotInfo.dateTime} ngày {errorSlotInfo.date}. Vui lòng
                  chọn khung khác hoặc gọi hotline.
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                >
                  Quay lại chọn giờ
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đặt
                      lịch...
                    </>
                  ) : (
                    'Xác nhận đặt lịch'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
