'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addDays, format } from 'date-fns';
import GapService from '@/app/actions/GapServices';
import Lottie from 'react-lottie';
import successJson from '@images/Lottie/success.json';
import rightArrowJson from '@images/Lottie/rightArrow.json';
import logoHeaderWhite from '@images/Icon/logoHeaderWhite.svg';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

import './style.scss';
import { toast } from 'sonner';
import {
  BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
  TIME_BOOKING,
  BookingOptionEachDayType,
} from '@/lib/constants';
import { StoreServices } from '@/store/useAppStore';
import useAppStore, { type SettingData } from '@/store/useAppStore';
import Image from 'next/image';

// Types
interface DayBooking {
  dayName: string;
  date: string;
  dayCode: string;
}

interface TimeBooking {
  timeName: string;
  timeCode: string;
}

interface BookingOptionEachDay {
  OPTION_1?: string;
  OPTION_2?: string;
  OPTION_3?: string;
  OPTION_4?: string;
  OPTION_5?: string;
  OPTION_6?: string;
  OPTION_7?: string;
  OPTION_8?: string;
  OPTION_9?: string;
  [key: string]: string | undefined;
}

interface ErrorSlotInfo {
  customerName: string;
  date: string;
  dateTime: string;
  phoneNumber: string;
}

interface ConsignmentScreenProps {
  backConsignment: () => void;
}

// Form schema
const formSchema = z.object({
  customerName: z.string().min(1, 'Vui lòng nhập tên quý khách'),
  phoneNumber: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  numberOfProduct: z
    .number()
    .min(5, 'Số lượng ký gửi tối thiểu là 5 món')
    .max(100, 'Số lượng tối đa là 100'),
});

type FormValues = z.infer<typeof formSchema>;

const DAY_NAMES: Record<string, string> = {
  Sunday: 'Chủ Nhật',
  Monday: 'Thứ hai',
  Tuesday: 'Thứ ba',
  Wednesday: 'Thứ tư',
  Thursday: 'Thứ năm',
  Friday: 'Thứ sáu',
  Saturday: 'Thứ bảy',
};

const defaultOptionsSuccess = {
  loop: false,
  autoplay: true,
  animationData: successJson,
};

const defaultOptionsRightArrow = {
  loop: true,
  autoplay: true,
  animationData: rightArrowJson,
};

const ConsignmentScreen: React.FC<ConsignmentScreenProps> = ({
  backConsignment,
}) => {
  const [dayBooking, setDayBooking] = useState<DayBooking[]>([]);
  const [timeBooking, setTimeBooking] = useState<TimeBooking[]>([]);
  const [step, setStep] = useState<number>(0);
  const [errorSlotInfo, setErrorSlotInfo] = useState<ErrorSlotInfo | null>(
    null
  );
  const [isHideUserForm, setIsHideUserForm] = useState<boolean>(true);
  const [isHideDayColumn, setIsHideDayColumn] = useState<boolean>(false);
  const [choosenDayCode, setChoosenDayCode] = useState<string | null>(null);
  const [choosenTimeCode, setChoosenTimeCode] = useState<string | null>(null);
  const [bookingDataCode, setBookingDataCode] = useState<string>('');
  const [bookingOptionValue, setBookingOptionValue] = useState<number>(8);
  const [bookingOptionEachDay, setBookingOptionEachDay] =
    useState<BookingOptionEachDay>({});
  const [workingDayCount, setWorkingDayCount] = useState<number>(14);
  const [isConsigning, setIsConsigning] = useState<boolean>(false);
  const [bookingCustomOptionString, setBookingCustomOptionString] =
    useState<string>('default');
  const [isInitLoading, setIsInitLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      numberOfProduct: 5,
    },
  });

  const formValues = form.watch();

  /**
   * Tìm option + timeBooking tương ứng với ngày đã chọn.
   * Refactored từ 9 if-else chain → loop.
   */
  const checkDayCodeToBookingOption = useCallback(
    (
      choosenDay: DayBooking | null,
      bookingOptionData: BookingOptionEachDay = BOOKING_OPTION_EACH_DAY_DATA_DEFAULT
    ): { option: number; timeBooking: TimeBooking[] } => {
      const fallback = { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };

      if (!choosenDay?.dayCode || !bookingOptionData) return fallback;

      for (let i = 1; i <= 9; i++) {
        const key = `OPTION_${i}`;
        if (bookingOptionData[key]?.includes(choosenDay.dayCode)) {
          return {
            option: i,
            timeBooking:
              TIME_BOOKING[key as keyof typeof TIME_BOOKING] ??
              TIME_BOOKING.OPTION_8,
          };
        }
      }

      return fallback;
    },
    []
  );

  const fetchAppointment = useCallback(async (dayBookingData: DayBooking[]) => {
    const arrayDate = dayBookingData.map(item => `"${item.date}"`);
    const res = await GapService.getAppointmentWithDate(arrayDate);

    let code = '';
    if (res?.results) {
      res.results.forEach((item: any) => {
        if (item?.slot) code += `-${item.slot}-`;
      });
    }

    setBookingDataCode(code);
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        // Force fetch settings mới nhất thay vì dùng cache
        // Cache có thể stale hoặc thiếu data khi load trên device mới
        let settings: SettingData;
        try {
          const store = useAppStore.getState();
          settings = await store.fetchSettings();
        } catch {
          settings = {} as SettingData;
        }

        const dayCount = settings.WORKING_DAY_COUNT ?? 14;
        const optionEachDay =
          settings.BOOKING_OPTION_EACH_DAY ??
          BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

        const days: DayBooking[] = Array.from({ length: dayCount }, (_, i) => {
          const d = addDays(new Date(), i);
          const dateStr = format(d, 'dd-MM-yyyy');
          return {
            dayName: format(d, 'EEEE'),
            date: dateStr,
            dayCode: dateStr.replaceAll('-', ''),
          };
        });

        const firstDay = days[0];
        const firstDayCode = firstDay?.dayCode ?? '';
        const { option, timeBooking: timeBookingData } =
          checkDayCodeToBookingOption(firstDay, optionEachDay);

        const customOption =
          settings.BOOKING_OPTION_CUSTOM_EACH_DAY?.[firstDayCode] ?? 'default';

        setBookingCustomOptionString(customOption);
        setBookingOptionValue(option);
        setTimeBooking(timeBookingData);
        setBookingOptionEachDay(optionEachDay);
        setDayBooking(days);
        setWorkingDayCount(dayCount);

        await fetchAppointment(days);

        // Tự động chọn ngày đầu tiên sau khi load xong
        if (days.length > 0) {
          const firstDay = days[0];
          const firstDayCustomOption =
            settings.BOOKING_OPTION_CUSTOM_EACH_DAY?.[firstDay.dayCode] ??
            'default';
          setChoosenDayCode(firstDay.dayCode);
          setBookingCustomOptionString(firstDayCustomOption);
          setStep(1);
        }

        setIsInitLoading(false);
      } catch (err) {
        console.error('[BookingForm] initData failed:', err);
        setInitError(true);
        setIsInitLoading(false);
      }
    };

    initData();
  }, [checkDayCodeToBookingOption, fetchAppointment]);

  const onChooseDay = async (choosenDay: DayBooking) => {
    const settings = await StoreServices.getSetting();
    const { option, timeBooking: timeBookingData } =
      checkDayCodeToBookingOption(choosenDay, bookingOptionEachDay);

    const customOption =
      settings.BOOKING_OPTION_CUSTOM_EACH_DAY?.[choosenDay.dayCode] ??
      'default';

    setBookingCustomOptionString(customOption);
    setBookingOptionValue(option);
    setTimeBooking(timeBookingData);
    setStep(1);
    setIsHideUserForm(true);
    setChoosenTimeCode(null);
    setChoosenDayCode(choosenDay?.dayCode ?? '');
  };

  const onChooseTime = (choosenTime: TimeBooking) => {
    setStep(1);
    setChoosenTimeCode(choosenTime?.timeCode ?? '');
  };

  const convertCodeToTime = (): string => {
    if (!choosenTimeCode || !choosenDayCode) return '---';

    const time = `${choosenTimeCode.substring(0, 2)}:${choosenTimeCode.substring(2, 4)}`;
    const day = `${choosenDayCode.substring(0, 2)}-${choosenDayCode.substring(2, 4)}-${choosenDayCode.substring(4, 8)}`;
    return `${day} ${time}`;
  };

  const onConsign = async (values: FormValues) => {
    if (!choosenTimeCode || !choosenDayCode) return;

    setIsConsigning(true);
    setErrorSlotInfo(null);

    const time = `${choosenTimeCode.substring(0, 2)}:${choosenTimeCode.substring(2, 4)}`;
    const day = `${choosenDayCode.substring(0, 2)}-${choosenDayCode.substring(2, 4)}-${choosenDayCode.substring(4, 8)}`;
    const slotID = choosenTimeCode + choosenDayCode;
    const newBookingDataCode = `${bookingDataCode}-${slotID}-`;

    // Check trùng số điện thoại trong cùng ngày
    const resWithPhone = await GapService.getAppointmentWithPhone(
      values.phoneNumber
    );

    if (resWithPhone?.results?.length > 0) {
      const conflict = resWithPhone.results.find(
        (item: any) => item.date === day
      );
      if (conflict) {
        setIsConsigning(false);
        setErrorSlotInfo({
          customerName: conflict.customerName,
          date: conflict.date,
          dateTime: conflict.dateTime,
          phoneNumber: conflict.phoneNumber,
        });
        return;
      }
    }

    const res = await GapService.setAppointment(values, slotID, time, day);

    if (res && typeof res === 'object' && 'objectId' in res && res.objectId) {
      setBookingDataCode(newBookingDataCode);
      setIsHideUserForm(true);
      setIsConsigning(false);
      setStep(3);
      setIsHideDayColumn(true);
    } else if (
      res &&
      typeof res === 'object' &&
      'serverError' in res &&
      res.serverError
    ) {
      // Lỗi từ BE beforeSave (slot đóng / ngày off / bị chiếm)
      setIsConsigning(false);
      toast.error(res.serverError as string, { duration: 6000 });
      // Tự đồng bộ lại lịch hẹn để UI phản ánh trạng thái mới nhất
      await fetchAppointment(dayBooking);
      // Re-fetch settings để cập nhật option ngày (ngày off, custom slot)
      const freshSettings = await GapService.getSetting();
      if (freshSettings?.results?.[0]?.Setting) {
        const newSetting = freshSettings.results[0].Setting;
        const newOptionEachDay =
          newSetting['BOOKING_OPTION_EACH_DAY'] ?? bookingOptionEachDay;
        setBookingOptionEachDay(newOptionEachDay);

        // Cập nhật lại option + timeBooking cho ngày đang chọn
        if (choosenDayCode) {
          const { option: newOption, timeBooking: newTimeBooking } =
            checkDayCodeToBookingOption(
              { dayName: '', date: day, dayCode: choosenDayCode },
              newOptionEachDay
            );
          setBookingOptionValue(newOption);
          setTimeBooking(newTimeBooking);
          const newCustom =
            newSetting['BOOKING_OPTION_CUSTOM_EACH_DAY']?.[choosenDayCode] ??
            'default';
          setBookingCustomOptionString(newCustom);
        }
      }
      // Reset time đã chọn vì slot đó có thể không còn khả dụng
      setChoosenTimeCode(null);
      setStep(1);
    } else {
      setIsConsigning(false);
      await fetchAppointment(dayBooking);
      toast.error('Đặt lịch thất bại. Vui lòng thử lại.');
    }
  };

  const onHandleStepTwo = () => {
    setIsHideUserForm(false);
    setTimeout(() => setStep(2), 200);
  };

  const backStepOne = () => {
    setIsHideUserForm(true);
    fetchAppointment(dayBooking);
    setTimeout(() => setStep(1), 200);
  };

  const resetAndBackProps = (isOpenInstrucmentPage: boolean = false) => {
    form.reset({ customerName: '', phoneNumber: '', numberOfProduct: 5 });
    setStep(0);
    setIsHideDayColumn(false);
    setChoosenDayCode(null);
    setChoosenTimeCode(null);
    fetchAppointment(dayBooking);
    backConsignment();

    if (isOpenInstrucmentPage) {
      window.open(
        'https://giveawaypremium.com.vn/kygui?tab=phuongthuc',
        '_blank'
      );
    }
  };

  const isShowBookingForm = StoreServices.getSettingWithKey(
    'IS_SHOW_BOOKING_FORM',
    'true'
  );
  const isSubmitDisabled =
    formValues.numberOfProduct < 5 ||
    formValues.numberOfProduct > 100 ||
    isConsigning;

  return (
    <div className="bookingform-home-container">
      {!isShowBookingForm ? (
        <div className="flex flex-col w-3/5 mt-10">
          <p className="text day-txt">
            Hiện tại tính năng đặt lịch ký gửi trên website đang tạm khoá.
          </p>
          <p className="text day-txt">
            Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm thông tin.
          </p>
          <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
          <Button
            className="MT20 max-w-[150px]"
            onClick={() => resetAndBackProps()}
          >
            Quay lại
          </Button>
        </div>
      ) : (
        <div className="bookingform">
          {/* Cột chọn ngày */}
          <div
            style={{
              maxHeight: '80vh',
              overflowX: 'hidden',
              overflowY: 'scroll',
            }}
            className={cn('dayBooking-box', !isHideDayColumn && 'show')}
          >
            {isInitLoading
              ? // Skeleton — 7 placeholder ngày trong lúc load
                Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="day-box"
                    style={{ opacity: 1 - i * 0.1, pointerEvents: 'none' }}
                  >
                    <span className="block h-4 w-16 rounded bg-gray-200 animate-pulse" />
                    <span className="block h-3 w-20 rounded bg-gray-100 animate-pulse mt-1" />
                  </div>
                ))
              : dayBooking.map((dayItem, dayIndex) => (
                  <div
                    key={dayItem.dayCode}
                    className="day-box"
                    onClick={() => onChooseDay(dayItem)}
                    style={
                      choosenDayCode === dayItem.dayCode
                        ? { borderColor: 'black', opacity: 1 }
                        : choosenDayCode && choosenDayCode !== dayItem.dayCode
                          ? { opacity: 0.4 }
                          : {}
                    }
                  >
                    <span className="text day-name">
                      {dayIndex === 0
                        ? 'Hôm nay'
                        : (DAY_NAMES[dayItem.dayName] ?? dayItem.dayName)}
                    </span>
                    <span className="text text-base sm:text-sm day-txt">
                      {dayItem.date}
                    </span>
                  </div>
                ))}

            <Lottie
              style={{
                transform: 'rotate(90deg)',
                position: 'absolute',
                bottom: 0,
                right: '-30px',
                zoom: 0.8,
              }}
              options={defaultOptionsRightArrow}
              height={100}
              width={100}
              speed={1}
              isStopped={isInitLoading}
              isPaused={isInitLoading}
            />
          </div>

          {/* Cột chọn giờ + form */}
          <div className="timeBooking-box">
            {/* Hint chọn ngày — đã bỏ vì ngày đầu tiên được chọn tự động */}

            {/* Spinner trung tâm khi đang init */}
            {isInitLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Đang tải lịch...</span>
              </div>
            )}

            {/* Error state — hiện khi network lỗi (mobile không reach server) */}
            {!isInitLoading && initError && (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                <span className="text-3xl">📵</span>
                <p className="text day-txt text-sm">
                  Không thể tải lịch đặt hẹn.
                  <br />
                  Vui lòng kiểm tra kết nối mạng và thử lại.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInitError(false);
                    setIsInitLoading(true);
                    // Re-trigger useEffect bằng cách force reload
                    window.location.reload();
                  }}
                >
                  Thử lại
                </Button>
                <span
                  onClick={() => resetAndBackProps(false)}
                  className="text text-sm opacity-60 cursor-pointer"
                >
                  {'< Quay lại'}
                </span>
              </div>
            )}
            {!isInitLoading && !initError && bookingOptionValue === 7 ? (
              // Trạng thái tạm khoá
              <div className="justity-center align-center">
                <div className="flex flex-col w-[90%] justify-center items-center">
                  <Image
                    width={70}
                    src={logoHeaderWhite}
                    style={{ objectFit: 'contain' }}
                    alt="logo"
                  />
                </div>
                <div className="flex flex-col w-[85%] mx-[5%] mt-[30px]">
                  <p className="text day-txt">
                    Hiện tại tính năng đặt lịch ký gửi trên website đang tạm
                    khoá.
                  </p>
                  <p className="text day-txt">
                    Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm
                    thông tin.
                  </p>
                  <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
                  <div className="flex flex-col w-full justify-center items-center mt-5">
                    <Button
                      className="MT20 max-w-[150px]"
                      onClick={() => resetAndBackProps()}
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Grid các khung giờ */}
                <div
                  style={{
                    gridTemplateColumns:
                      bookingOptionValue === 9 ? 'auto auto auto' : 'auto auto',
                  }}
                  className={cn(
                    'timeBooking-grid',
                    step === 1 && isHideUserForm && 'show'
                  )}
                >
                  {timeBooking.map((itemTime, indexTime) => {
                    const isBusy = bookingDataCode.includes(
                      itemTime.timeCode + choosenDayCode
                    );
                    const isReady =
                      !bookingDataCode.includes(
                        choosenTimeCode + choosenDayCode
                      ) && itemTime.timeCode === choosenTimeCode;
                    const isShow =
                      bookingCustomOptionString === 'default'
                        ? true
                        : bookingCustomOptionString.includes(itemTime.timeCode);

                    if (!isShow) return null;

                    return (
                      <div
                        key={indexTime}
                        style={
                          isBusy
                            ? { pointerEvents: 'none', cursor: 'none' }
                            : {}
                        }
                        onClick={() => !isBusy && onChooseTime(itemTime)}
                        className={cn(
                          'time-box',
                          isReady && 'ready',
                          isBusy && 'busy'
                        )}
                      >
                        <span className="text text-base sm:text-sm">
                          {itemTime.timeName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div
                  className={cn(
                    'explain-box',
                    step === 1 && isHideUserForm && 'show'
                  )}
                >
                  <div className="explain-box-left">
                    <div className="box-full" />
                    <span className="box-text">Đã Đặt Chỗ</span>
                  </div>
                  <div className="explain-box-right">
                    <div className="box-empty" />
                    <span className="box-text">Còn Trống</span>
                  </div>
                </div>

                {/* Footer navigation */}
                <div
                  className={cn(
                    'timeBooking-footer',
                    (step === 1 || step === 0) && isHideUserForm && 'show'
                  )}
                >
                  <span
                    onClick={() => resetAndBackProps(false)}
                    className="text"
                  >
                    {'< Quay lại'}
                  </span>
                  {step === 1 && (
                    <span
                      onClick={onHandleStepTwo}
                      className="text"
                      style={
                        choosenTimeCode
                          ? { color: 'black' }
                          : { opacity: 0.5, pointerEvents: 'none' }
                      }
                    >
                      {'Tiếp tục >'}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Form nhập thông tin */}
            <Form {...form}>
              <form
                className={cn(
                  'w-[95%] sm:w-[80%] px-2 sm:px-0 timeBooking-form',
                  !isHideUserForm && step === 2 && 'show'
                )}
                onSubmit={form.handleSubmit(onConsign)}
              >
                <div className="flex flex-col gap-3 sm:gap-4 sell-card-form justify-center">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Thời gian</Label>
                    <Input
                      value={convertCodeToTime()}
                      readOnly
                      placeholder="..."
                      className="w-full"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1 space-y-0">
                        <FormLabel className="text-sm font-medium">
                          Họ và Tên
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nhập họ và tên..."
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1 space-y-0">
                        <FormLabel className="text-sm font-medium">
                          Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Nhập số điện thoại..."
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfProduct"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1 space-y-0">
                        <FormLabel className="text-sm font-medium">
                          Số lượng Hàng Hoá
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Số lượng..."
                            className="w-full sm:w-32"
                            onChange={e =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {formValues.numberOfProduct > 50 &&
                    formValues.numberOfProduct <= 100 && (
                      <p className="text-red-500 text-sm">
                        Với số lượng hàng hoá trên 50, Xin vui lòng liên hệ
                        hotline 0703334443 để được hỗ trợ tốt nhất.
                      </p>
                    )}

                  <div className="bookingNoteString">
                    <span>
                      *Chúng tôi sẽ giữ lịch tối đa 15 phút nếu đến trễ Anh/Chị
                      vui lòng đợi theo số thứ tự tại cửa hàng
                    </span>
                  </div>

                  {errorSlotInfo && (
                    <div className="bookingErrorSlot">
                      <span>
                        Khách hàng {errorSlotInfo.customerName} đã đặt lịch cho
                        khung thời gian {errorSlotInfo.dateTime} ngày{' '}
                        {errorSlotInfo.date}. Vui lòng đặt lịch lại cho vào ngày
                        khác hoặc liên hệ hotline 0703334443 để được thay đổi
                        lịch hẹn cùng ngày.
                      </span>
                    </div>
                  )}

                  <div className="flex justify-around items-center w-full mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={backStepOne}
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitDisabled}
                    >
                      {isConsigning ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            {/* Màn hình xác nhận thành công */}
            <div
              className={cn(
                'timeBooking-confirm',
                isHideUserForm && step === 3 && 'show'
              )}
            >
              <Lottie
                options={defaultOptionsSuccess}
                height={150}
                width={150}
                isStopped={false}
                isPaused={false}
              />
              <div className="flex justify-center">
                <div className="w-4/5 space-y-2">
                  <div className="flex gap-2">
                    <span className="font-medium">Thời gian ký gửi:</span>
                    <span>{convertCodeToTime()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Tên Khách Hàng:</span>
                    <span>{formValues.customerName}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{formValues.phoneNumber}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Số lượng hàng hoá:</span>
                    <span>{formValues.numberOfProduct}</span>
                  </div>
                </div>
              </div>
              <Button className="MT20" onClick={() => resetAndBackProps(true)}>
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsignmentScreen;
