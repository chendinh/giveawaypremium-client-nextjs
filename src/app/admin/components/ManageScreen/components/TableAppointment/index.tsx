'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import moment from 'moment';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import {
  BOOKING_OPTION_EACH_DAY,
  BOOKING_OPTION_CUSTOM_EACH_DAY,
  BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
  TIME_BOOKING,
  WORKING_DAY_COUNT,
  type TimeBookingItem,
  type BookingOptionEachDayType,
} from '@/lib/constants';

import './style.scss';

// ─── Types ────────────────────────────────────────────
interface DayBookingItem {
  dayName: string;
  date: string;
  dayCode: string;
}

interface AppointmentItem {
  slot?: string;
  date?: string;
  dateTime?: string;
  customerName?: string;
  phoneNumber?: string;
  numberOfProduct?: number | string;
  objectId?: string;
  createdAt?: string;
}

// ─── Helpers ──────────────────────────────────────────
const translationDate = (key: string): string => {
  switch (key) {
    case 'Sunday':
      return 'Chủ Nhật';
    case 'Monday':
      return 'Thứ hai';
    case 'Tuesday':
      return 'Thứ ba';
    case 'Wednesday':
      return 'Thứ tư';
    case 'Thursday':
      return 'Thứ năm';
    case 'Friday':
      return 'Thứ sáu';
    case 'Saturday':
      return 'Thứ bảy';
    default:
      return key;
  }
};

const checkDayCodeToBookingOption = (
  choosenDay: DayBookingItem | { dayCode: string } | null,
  bookingOptionData: BookingOptionEachDayType = BOOKING_OPTION_EACH_DAY_DATA_DEFAULT
): { option: number; timeBooking: TimeBookingItem[] } => {
  if (choosenDay && choosenDay.dayCode && bookingOptionData) {
    for (let i = 1; i <= 9; i++) {
      const key = `OPTION_${i}`;
      if (
        bookingOptionData[key] &&
        bookingOptionData[key]!.includes(choosenDay.dayCode)
      ) {
        return {
          option: i,
          timeBooking: TIME_BOOKING[key] || TIME_BOOKING.OPTION_8,
        };
      }
    }
    return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
  }
  return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
};

const MAX_BOOKING_DAYS = 35;

// ─── Booking option labels ──────────────────────────────
const BOOKING_OPTION_LABELS: Record<number, string> = {
  1: 'Full ngày - 30 phút',
  2: 'Full ngày - 1 tiếng',
  3: 'Sáng 30 phút',
  4: 'Sáng 1 tiếng',
  5: 'Chiều 30 phút',
  6: 'Chiều 1 tiếng',
  7: 'Off nghỉ!',
  8: 'Định dạng cũ',
  9: 'Full ngày - 15 phút',
};

const getBookingOptionsForOption = (option: number): number[] => {
  switch (option) {
    case 1:
      return [1];
    case 2:
      return [1, 2];
    case 3:
      return [1, 3];
    case 4:
      return [1, 2, 3, 4];
    case 5:
      return [5];
    case 6:
      return [5, 6];
    case 7:
      return [1, 2, 3, 4, 5, 6, 7, 8];
    case 8:
      return [1, 8];
    case 9:
      return [7];
    default:
      return [1, 2, 3, 4, 5, 6, 7, 8];
  }
};

const ALL_BOOKING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ─── Working day options ────────────────────────────────
const WORKING_DAY_OPTIONS = [
  { value: 14, label: 'Mặc định 14 ngày' },
  { value: 1, label: '1 ngày' },
  { value: 2, label: '2 ngày' },
  { value: 3, label: '3 ngày' },
  { value: 4, label: '4 ngày' },
  { value: 5, label: '5 ngày' },
  { value: 6, label: '6 ngày' },
  { value: 7, label: '7 ngày' },
];

// ─── Component ────────────────────────────────────────
const TableAppointmentScreen: React.FC = () => {
  const { settings, setSettings, updateSettingWithKey } = useAppStore();

  // Day booking
  const [dayBooking, setDayBooking] = useState<DayBookingItem[]>([]);
  const [choosenDayCode, setChoosenDayCode] = useState<string | null>(null);
  const [choosenTimeCode, setChoosenTimeCode] = useState<string | null>(null);
  const [isLast7Day, setIsLast7Day] = useState<boolean>(false);

  // Time booking
  const [timeBooking, setTimeBooking] = useState<TimeBookingItem[]>([]);
  const [bookingOptionValue, setBookingOptionValue] = useState<number>(8);
  const [bookingOptionEachDay, setBookingOptionEachDay] =
    useState<BookingOptionEachDayType>(BOOKING_OPTION_EACH_DAY_DATA_DEFAULT);
  const [bookingCustomOptionString, setBookingCustomOptionString] = useState<
    string | undefined
  >('default');

  // Appointment data
  const [bookingUserInfo, setBookingUserInfo] = useState<AppointmentItem[]>([]);
  const [bookingDataCode, setBookingDataCode] = useState<string>('');
  const [isLoadingBooking, setIsLoadingBooking] = useState<boolean>(false);

  // Working day count
  const [workingDayCount, setWorkingDayCount] = useState<number>(14);

  // Search
  const [inputValue, setInputValue] = useState<string>('');
  const [searchInfo, setSearchInfo] = useState<string>('');

  // Info modal
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);

  // ── Fetch appointments ──
  const fetchAppointment = useCallback(async (days: DayBookingItem[]) => {
    setIsLoadingBooking(true);
    try {
      const arrayDate = days.map(item => `"${item.date}"`);
      const res = await GapService.getAppointmentWithDate(arrayDate);

      if (res && res.results) {
        let codeStr = '';
        res.results.forEach((item: AppointmentItem) => {
          if (item && item.slot) {
            codeStr += '-' + item.slot + '-';
          }
        });
        setBookingUserInfo(res.results as AppointmentItem[]);
        setBookingDataCode(codeStr);
      } else {
        toast.error('Không thể tải dữ liệu!');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      toast.error('Không thể tải dữ liệu!');
    }
    setIsLoadingBooking(false);
  }, []);

  // ── Init ──
  useEffect(() => {
    const dayBookingTemp: DayBookingItem[] = [];
    for (let i = 0; i < MAX_BOOKING_DAYS; i++) {
      dayBookingTemp.push({
        dayName: moment().add(i, 'day').format('dddd'),
        date: moment().add(i, 'day').format('DD-MM-YYYY'),
        dayCode: moment()
          .add(i, 'day')
          .format('DD-MM-YYYY')
          .replaceAll('-', ''),
      });
    }

    const optionEachDay: BookingOptionEachDayType =
      (settings.BOOKING_OPTION_EACH_DAY as unknown as BookingOptionEachDayType) ||
      BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

    const firstDayCode = dayBookingTemp[0]?.dayCode || '';
    const { option, timeBooking: tb } = checkDayCodeToBookingOption(
      dayBookingTemp[0],
      optionEachDay
    );

    let wdCount = 14;
    if (settings.WORKING_DAY_COUNT) {
      wdCount = settings.WORKING_DAY_COUNT;
    }

    let customOptionStr = 'default';
    if (
      settings.BOOKING_OPTION_CUSTOM_EACH_DAY &&
      settings.BOOKING_OPTION_CUSTOM_EACH_DAY[firstDayCode]
    ) {
      customOptionStr = settings.BOOKING_OPTION_CUSTOM_EACH_DAY[firstDayCode];
    }

    setBookingCustomOptionString(customOptionStr);
    setBookingOptionValue(option);
    setTimeBooking(tb);
    setBookingOptionEachDay(optionEachDay);
    setChoosenDayCode(firstDayCode);
    setDayBooking(dayBookingTemp);
    setWorkingDayCount(wdCount);

    fetchAppointment(dayBookingTemp);
    // Settings are read once at mount; fetchAppointment has no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Choose day ──
  const onChooseDay = useCallback(
    (choosenDay: DayBookingItem, isLast: boolean = false) => {
      const { option, timeBooking: tb } = checkDayCodeToBookingOption(
        choosenDay,
        bookingOptionEachDay
      );

      let customStr = 'default';
      if (
        settings.BOOKING_OPTION_CUSTOM_EACH_DAY &&
        settings.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode]
      ) {
        customStr = settings.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode];
      }

      setBookingCustomOptionString(customStr);
      setBookingOptionValue(option);
      setTimeBooking(tb);
      setIsLast7Day(isLast);
      setChoosenTimeCode(null);
      setChoosenDayCode(choosenDay.dayCode);
    },
    [bookingOptionEachDay, settings.BOOKING_OPTION_CUSTOM_EACH_DAY]
  );

  // ── Choose time (show info) ──
  const onChooseTime = useCallback(
    (itemTime: TimeBookingItem) => {
      setChoosenTimeCode(itemTime.timeCode);
      const slotCode = itemTime.timeCode + choosenDayCode;
      const foundUser = bookingUserInfo.find(u => u.slot === slotCode);

      if (foundUser && foundUser.objectId) {
        setSelectedAppointment(foundUser);
        setInfoModalOpen(true);
      } else {
        toast.info('Không tìm thấy thông tin');
      }
    },
    [choosenDayCode, bookingUserInfo]
  );

  // ── Delete appointment ──
  const handleDeleteAppointment = useCallback(async () => {
    if (!selectedAppointment?.objectId) return;
    try {
      const res = await GapService.deleteAppointmentWithSlotId(
        selectedAppointment.objectId
      );
      if (res?.code === 101 || res?.error) {
        toast.error('Xoá không thành công');
      } else {
        toast.success('Xoá thành công');
        const slotCode = (choosenTimeCode || '') + (choosenDayCode || '');
        setBookingDataCode(prev => prev.replace(slotCode, ''));
        setChoosenTimeCode(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setInfoModalOpen(false);
    setSelectedAppointment(null);
  }, [selectedAppointment, choosenTimeCode, choosenDayCode]);

  // ── Change working day option ──
  const onChangeWorkingDayOption = useCallback(
    async (value: number) => {
      setIsLoadingBooking(true);
      try {
        const res = await GapService.updateSettingWithKeyAndValue(
          WORKING_DAY_COUNT,
          value as unknown as string,
          settings
        );
        if (res?.code === 101 || res?.error) {
          toast.error('Thay đổi không thành công');
        } else {
          setBookingOptionValue(8);
          setTimeBooking([]);
          setWorkingDayCount(value);
          setChoosenDayCode(null);
          setIsLast7Day(false);
          setChoosenTimeCode(null);
          updateSettingWithKey(WORKING_DAY_COUNT, value);
          toast.success('Thay đổi thành công');
        }
      } catch (err) {
        console.error(err);
        toast.error('Có lỗi xảy ra');
      }
      setIsLoadingBooking(false);
    },
    [updateSettingWithKey]
  );

  // ── Change booking option ──
  const onChangeBookingOption = useCallback(
    async (value: number) => {
      if (!choosenDayCode) return;
      const currentEachDay =
        (settings.BOOKING_OPTION_EACH_DAY as unknown as BookingOptionEachDayType) ||
        BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

      const bookingOptionList: BookingOptionEachDayType = {
        ...currentEachDay,
      };
      // Remove current day code from all options
      for (let i = 1; i <= 9; i++) {
        const key = `OPTION_${i}`;
        bookingOptionList[key] = bookingOptionList[key]
          ? bookingOptionList[key]!.replaceAll(choosenDayCode, '-')
          : '-';
      }
      // Add to selected option
      bookingOptionList[`OPTION_${value}`] =
        (bookingOptionList[`OPTION_${value}`] || '') + `--${choosenDayCode}--`;

      try {
        const res = await GapService.updateSettingWithKeyAndValue(
          BOOKING_OPTION_EACH_DAY,
          bookingOptionList as unknown as string,
          settings
        );
        if (res?.code === 101 || res?.error) {
          toast.error('Thay đổi không thành công');
        } else {
          setTimeBooking(
            TIME_BOOKING[`OPTION_${value}`] || TIME_BOOKING.OPTION_8
          );
          setBookingOptionValue(value);
          setBookingOptionEachDay(bookingOptionList);
          updateSettingWithKey(BOOKING_OPTION_EACH_DAY, bookingOptionList);
          toast.success('Thay đổi thành công');
        }
      } catch (err) {
        console.error(err);
        toast.error('Có lỗi xảy ra');
      }
    },
    [choosenDayCode, settings.BOOKING_OPTION_EACH_DAY, updateSettingWithKey]
  );

  // ── Select/deselect individual time booking ──
  const onSelectTimeBooking = useCallback(
    async (selectedTimeCode: string, isOn: boolean = true) => {
      if (!choosenDayCode) return;
      const customEachDay = settings.BOOKING_OPTION_CUSTOM_EACH_DAY || {};
      const bookingCustomOptionList: Record<string, string> = {
        ...customEachDay,
      };
      const isExistCustomThisDay = !!customEachDay[choosenDayCode];

      let acceptedCustomTimeCodeString = '';
      if (!isExistCustomThisDay) {
        if (!isOn) {
          timeBooking.forEach(item => {
            acceptedCustomTimeCodeString += `-${selectedTimeCode === item.timeCode ? '-' : item.timeCode}-`;
          });
        }
        bookingCustomOptionList[choosenDayCode] = acceptedCustomTimeCodeString;
      } else {
        acceptedCustomTimeCodeString = customEachDay[choosenDayCode];
        if (!isOn) {
          acceptedCustomTimeCodeString =
            acceptedCustomTimeCodeString.replaceAll(selectedTimeCode, '-');
        } else {
          acceptedCustomTimeCodeString += `-${selectedTimeCode}-`;
        }
        bookingCustomOptionList[choosenDayCode] = acceptedCustomTimeCodeString;
      }

      try {
        const res = await GapService.updateSettingWithKeyAndValue(
          BOOKING_OPTION_CUSTOM_EACH_DAY,
          bookingCustomOptionList as unknown as string,
          settings
        );
        if (res?.code === 101 || res?.error) {
          toast.error('Thay đổi không thành công');
        } else {
          setBookingCustomOptionString(
            acceptedCustomTimeCodeString || bookingCustomOptionString
          );
          updateSettingWithKey(
            BOOKING_OPTION_CUSTOM_EACH_DAY,
            bookingCustomOptionList
          );
          toast.success('Thay đổi thành công');
        }
      } catch (err) {
        console.error(err);
        toast.error('Có lỗi xảy ra');
      }
    },
    [
      choosenDayCode,
      settings.BOOKING_OPTION_CUSTOM_EACH_DAY,
      timeBooking,
      bookingCustomOptionString,
      updateSettingWithKey,
    ]
  );

  // ── Search by phone ──
  const handleInputConfirm = useCallback(async () => {
    const formatedValue = inputValue.trim();
    if (!formatedValue) return;
    try {
      const res = await GapService.getAppointmentWithPhone(formatedValue);
      if (res && res.results && res.results[0]) {
        setSearchInfo(
          `Tên: ${res.results[0].customerName}\nSdt: ${res.results[0].phoneNumber}\nĐặt lịch ngày: ${res.results[0].date}\nThời gian: ${res.results[0].dateTime}`
        );
      } else {
        setSearchInfo('Không có thông tin');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  }, [inputValue]);

  // ── Compute booking options for Select ──
  const availableBookingOptions = isLast7Day
    ? ALL_BOOKING_OPTIONS
    : getBookingOptionsForOption(bookingOptionValue);

  // ── Render ──
  return (
    <>
      <div className="TableAppointment-home-container">
        <div className="bookingform">
          {/* Day column */}
          <div
            style={{
              overflowX: 'hidden',
              overflowY: 'scroll',
              position: 'relative',
            }}
            className="dayBooking-box show"
          >
            {dayBooking.map((dayItem, dayIndex) => {
              const isLast = dayIndex >= workingDayCount;
              return (
                <div
                  key={dayIndex}
                  className="day-box"
                  onClick={() => onChooseDay(dayItem, isLast)}
                  style={
                    choosenDayCode && choosenDayCode === dayItem.dayCode
                      ? isLast
                        ? { borderColor: 'green', opacity: 1 }
                        : { borderColor: 'black', opacity: 1 }
                      : choosenDayCode && choosenDayCode !== dayItem.dayCode
                        ? { opacity: 0.4 }
                        : {}
                  }
                >
                  <span
                    className="text day-name"
                    style={isLast ? { color: 'green' } : {}}
                  >
                    {dayIndex === 0
                      ? 'Hôm nay'
                      : translationDate(dayItem.dayName)}
                  </span>
                  <span
                    className="text day-txt"
                    style={isLast ? { color: 'green' } : {}}
                  >
                    {dayItem.date}
                  </span>
                </div>
              );
            })}

            {/* Scroll indicator */}
            <div className="flex items-center justify-center py-2">
              <ChevronDown className="h-5 w-5 text-muted-foreground animate-bounce" />
            </div>
          </div>

          {/* Time grid */}
          <div className="timeBooking-box">
            <div
              style={
                bookingOptionValue === 9
                  ? { gridTemplateColumns: 'auto auto auto' }
                  : { gridTemplateColumns: 'auto auto' }
              }
              className="timeBooking-grid show"
            >
              {isLoadingBooking ? (
                <div className="flex items-center justify-center col-span-full h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : bookingOptionValue === 7 ? (
                <div className="flex flex-col items-center justify-center col-span-full">
                  <div className="flex flex-col items-center w-[90%]">
                    <p className="text-sm text-muted-foreground mt-6">
                      Hiện tại tính năng đặt lịch ký gửi trên website đang tạm
                      khoá.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm
                      thông tin.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Xin lỗi vì sự bất tiện này.
                    </p>
                  </div>
                </div>
              ) : timeBooking ? (
                timeBooking.map((itemTime, indexTime) => {
                  const isReady =
                    !bookingDataCode.includes(
                      (choosenTimeCode || '') + (choosenDayCode || '')
                    ) && itemTime.timeCode === choosenTimeCode;
                  const isBusy = bookingDataCode.includes(
                    itemTime.timeCode + (choosenDayCode || '')
                  );

                  return (
                    <div key={indexTime} style={{ display: 'flex' }}>
                      <Switch
                        checked={
                          bookingCustomOptionString === 'default'
                            ? true
                            : !!bookingCustomOptionString?.includes(
                                itemTime.timeCode
                              )
                        }
                        onCheckedChange={checked => {
                          onSelectTimeBooking(itemTime.timeCode, checked);
                        }}
                        className="mr-2 mt-auto mb-auto"
                      />
                      <div
                        style={!isBusy ? { pointerEvents: 'none' } : {}}
                        onClick={() =>
                          isBusy ? onChooseTime(itemTime) : undefined
                        }
                        className={
                          'time-box' +
                          (isReady ? ' ready' : isBusy ? ' busy' : '')
                        }
                      >
                        <span className="text">{itemTime.timeName}</span>
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Search by phone */}
      <div className="search-info-user-booking-box">
        <Label className="text-sm">Tra cứu qua SĐT:</Label>
        <div className="flex items-center gap-2 mt-2 mb-2">
          <Input
            onChange={e => setInputValue(e.target.value)}
            maxLength={12}
            className="w-full max-w-[300px] h-10"
            placeholder="..."
            value={inputValue}
          />
          <Button size="sm" onClick={handleInputConfirm}>
            <Search className="h-3 w-3 mr-1" />
            OK
          </Button>
        </div>
        {searchInfo && (
          <span className="text-sm whitespace-pre-wrap mt-2">{searchInfo}</span>
        )}
      </div>

      {/* Booking option selector */}
      <div className="select-booking-option-box">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isLast7Day ? 'bg-green-500' : 'bg-orange-400'}`}
          />
          <Label className="text-sm">
            {isLast7Day ? 'Khung thời gian hoạt động' : 'Hiện đang hoạt động:'}
          </Label>
        </div>
        <Select
          value={String(bookingOptionValue)}
          onValueChange={val => onChangeBookingOption(Number(val))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="..." />
          </SelectTrigger>
          <SelectContent>
            {availableBookingOptions.map(opt => (
              <SelectItem key={opt} value={String(opt)}>
                {BOOKING_OPTION_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Working day option selector */}
      <div className="select-booking-option-box">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <Label className="text-sm">Số ngày làm việc</Label>
        </div>
        <Select
          value={String(workingDayCount)}
          onValueChange={val => onChangeWorkingDayOption(Number(val))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="..." />
          </SelectTrigger>
          <SelectContent>
            {WORKING_DAY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointment info modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin lịch hẹn</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <span className="font-medium">Tên Khách Hàng:</span>
                <span>{selectedAppointment.customerName || '---'}</span>

                <span className="font-medium">Số lượng Hàng Hoá:</span>
                <span>{selectedAppointment.numberOfProduct || '---'}</span>

                <span className="font-medium">Số điện thoại:</span>
                <span>{selectedAppointment.phoneNumber || '---'}</span>

                <span className="font-medium">Đã đặt lúc:</span>
                <span>
                  {selectedAppointment.createdAt
                    ? moment(selectedAppointment.createdAt).format(
                        'HH:mm DD/MM/YYYY'
                      )
                    : '---'}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInfoModalOpen(false);
                setSelectedAppointment(null);
              }}
            >
              Quay lại
            </Button>
            <Button variant="destructive" onClick={handleDeleteAppointment}>
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableAppointmentScreen;
