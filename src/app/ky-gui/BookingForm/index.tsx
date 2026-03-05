'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// import ReduxServices from 'common/redux';
// import { images } from 'config/images';
// import MyModal from 'pages/Components/MyModal';
import moment from 'moment';
import GapService from '@/app/actions/GapServices';
import Lottie from 'react-lottie';
import successJson from '@images/Lottie/success.json';
import rightArrowJson from '@images/Lottie/rightArrow.json';

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

import './style.scss';
import { toast } from 'sonner';
import {
  BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
  TIME_BOOKING,
  BookingOptionEachDayType,
  TimeBookingItem,
} from '@/lib/constants';
import { useAppStore, StoreServices } from '@/store/useAppStore';

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

interface FormData {
  customerName: string;
  phoneNumber: string;
  numberOfProduct: number;
}

interface ErrorSlotInfo {
  customerName: string;
  date: string;
  dateTime: string;
  phoneNumber: string;
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

const ConsignmentScreen: React.FC<ConsignmentScreenProps> = ({
  backConsignment,
}) => {
  const router = useRouter();
  //   const myModal = useRef<any>(null);

  // States
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
  const [isErrorMax, setIsErrorMax] = useState<boolean>(false);
  const [bookingOptionValue, setBookingOptionValue] = useState<number>(8);
  const [bookingOptionEachDay, setBookingOptionEachDay] =
    useState<BookingOptionEachDay>({});
  const [workingDayCount, setWorkingDayCount] = useState<number>(14);
  const [isConsigning, setIsConsigning] = useState<boolean>(false);

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      numberOfProduct: 5,
    },
  });

  const checkDayCodeToBookingOption = useCallback(
    (
      choosenDay: DayBooking | null,
      bookingOptionData: BookingOptionEachDay = BOOKING_OPTION_EACH_DAY_DATA_DEFAULT
    ): { option: number; timeBooking: TimeBooking[] } => {
      console.log('checkDayCodeToBookingOption', choosenDay, bookingOptionData);
      if (choosenDay && choosenDay.dayCode && bookingOptionData) {
        if (bookingOptionData.OPTION_1?.includes(choosenDay.dayCode))
          return { option: 1, timeBooking: TIME_BOOKING.OPTION_1 };
        else if (bookingOptionData.OPTION_2?.includes(choosenDay.dayCode))
          return { option: 2, timeBooking: TIME_BOOKING.OPTION_2 };
        else if (bookingOptionData.OPTION_3?.includes(choosenDay.dayCode))
          return { option: 3, timeBooking: TIME_BOOKING.OPTION_3 };
        else if (bookingOptionData.OPTION_4?.includes(choosenDay.dayCode))
          return { option: 4, timeBooking: TIME_BOOKING.OPTION_4 };
        else if (bookingOptionData.OPTION_5?.includes(choosenDay.dayCode))
          return { option: 5, timeBooking: TIME_BOOKING.OPTION_5 };
        else if (bookingOptionData.OPTION_6?.includes(choosenDay.dayCode))
          return { option: 6, timeBooking: TIME_BOOKING.OPTION_6 };
        else if (bookingOptionData.OPTION_7?.includes(choosenDay.dayCode))
          return { option: 7, timeBooking: TIME_BOOKING.OPTION_7 };
        else if (bookingOptionData.OPTION_8?.includes(choosenDay.dayCode))
          return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
        else if (bookingOptionData.OPTION_9?.includes(choosenDay.dayCode))
          return { option: 9, timeBooking: TIME_BOOKING.OPTION_9 };
        else return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
      }
      return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
    },
    []
  );

  const fetchAppointment = useCallback(async (dayBookingData: DayBooking[]) => {
    const arrayDate: string[] = [];
    let bookingCode = '';

    dayBookingData.forEach(itemDate => {
      arrayDate.push(`"${itemDate.date}"`);
    });

    const res = await GapService.getAppointmentWithDate(arrayDate);

    if (res && res.results) {
      res.results.forEach((itemData: any) => {
        if (itemData && itemData.slot) {
          bookingCode += '-' + itemData.slot + '-';
        }
      });
    }

    setBookingDataCode(bookingCode);
  }, []);

  useEffect(() => {
    const initData = async () => {
      const newSettingRedux = await StoreServices.getSetting();
      let workingDayCountTemp = 14;

      if (newSettingRedux.WORKING_DAY_COUNT) {
        workingDayCountTemp = newSettingRedux.WORKING_DAY_COUNT;
      }

      const dayBookingTemp: DayBooking[] = [];
      const bookingOptionEachDayData =
        newSettingRedux.BOOKING_OPTION_EACH_DAY ||
        BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

      for (let i = 0; i < workingDayCountTemp; i++) {
        dayBookingTemp.push({
          dayName: moment().add(i, 'day').format('dddd'),
          date: moment().add(i, 'day').format('DD-MM-YYYY'),
          dayCode: moment()
            .add(i, 'day')
            .format('DD-MM-YYYY')
            .replaceAll('-', ''),
        });
      }

      const { option, timeBooking: timeBookingData } =
        checkDayCodeToBookingOption(
          dayBookingTemp[0],
          bookingOptionEachDayData
        );

      console.log('timeBookingData', timeBookingData);

      setBookingOptionValue(option);
      setTimeBooking(timeBookingData);
      setBookingOptionEachDay(bookingOptionEachDayData);
      setDayBooking(dayBookingTemp);
      setWorkingDayCount(workingDayCountTemp);

      await fetchAppointment(dayBookingTemp);
    };

    initData();
  }, [checkDayCodeToBookingOption, fetchAppointment]);

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

  const onChooseDay = (choosenDay: DayBooking) => {
    const { option, timeBooking: timeBookingData } =
      checkDayCodeToBookingOption(choosenDay, bookingOptionEachDay);

    setBookingOptionValue(option);
    setTimeBooking(timeBookingData);
    setStep(1);
    setIsHideUserForm(true);
    setChoosenTimeCode(null);
    setChoosenDayCode(choosenDay?.dayCode || '');
  };

  const onChooseTime = (choosenTime: TimeBooking) => {
    setStep(1);
    setChoosenTimeCode(choosenTime?.timeCode || '');
  };

  const convertCodeToTime = (): string => {
    if (choosenTimeCode && choosenDayCode) {
      const formatedTime =
        choosenTimeCode.substring(0, 2) + ':' + choosenTimeCode.substring(2, 4);
      const formatedDay =
        choosenDayCode.substring(0, 2) +
        '-' +
        choosenDayCode.substring(2, 4) +
        '-' +
        choosenDayCode.substring(4, 8);
      return formatedDay + ' ' + formatedTime;
    }
    return '---';
  };

  const onConsign = async (values: z.infer<typeof formSchema>) => {
    if (choosenTimeCode && choosenDayCode) {
      setIsConsigning(true);

      const formatedTime =
        choosenTimeCode.substring(0, 2) + ':' + choosenTimeCode.substring(2, 4);
      const formatedDay =
        choosenDayCode.substring(0, 2) +
        '-' +
        choosenDayCode.substring(2, 4) +
        '-' +
        choosenDayCode.substring(4, 8);
      const slotID = choosenTimeCode + choosenDayCode;
      const newBookingDataCode = bookingDataCode + '-' + slotID + '-';

      const resWithPhone = await GapService.getAppointmentWithPhone(
        values.phoneNumber
      );

      let isExistPhoneNumber = false;
      let errorInfo: ErrorSlotInfo | null = null;

      if (
        resWithPhone &&
        resWithPhone.results &&
        resWithPhone.results.length > 0
      ) {
        resWithPhone.results.forEach((item: any) => {
          if (item.date === formatedDay) {
            isExistPhoneNumber = true;
            errorInfo = {
              customerName: item.customerName,
              date: item.date,
              dateTime: item.dateTime,
              phoneNumber: item.phoneNumber,
            };
          }
        });

        if (isExistPhoneNumber) {
          setIsConsigning(false);
          setErrorSlotInfo(errorInfo);
          return;
        } else {
          setErrorSlotInfo(null);
        }
      } else {
        setErrorSlotInfo(null);
      }

      const res = await GapService.setAppointment(
        values,
        slotID,
        formatedTime,
        formatedDay
      );

      if (res && res.objectId) {
        setBookingDataCode(newBookingDataCode);
        setIsHideUserForm(true);
        setIsConsigning(false);
        setStep(3);
        setIsHideDayColumn(true);
      } else {
        setIsConsigning(false);
        await fetchAppointment(dayBooking);
        toast.error('Đặt lịch thất bại!');
      }
    }
  };

  const onHandleStepTwo = () => {
    setIsHideUserForm(false);
    setTimeout(() => {
      setStep(2);
    }, 200);
  };

  const backStepOne = () => {
    setIsHideUserForm(true);
    fetchAppointment(dayBooking);
    setTimeout(() => {
      setStep(1);
    }, 200);
  };

  const resetAndBackProps = (isOpenInstrucmentPage: boolean = false) => {
    form.reset({
      customerName: '',
      phoneNumber: '',
      numberOfProduct: 5,
    });
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
  const formValues = form.watch();

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

  return (
    <div className="bookingform-home-container">
      {!isShowBookingForm ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '60%',
            marginTop: '40px',
          }}
        >
          <p className="text day-txt">
            Hiện tại tính năng đặt lịch ký gửi trên website đang tạm khoá.
          </p>
          <p className="text day-txt">
            Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm thông tin.
          </p>
          <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
          <Button
            style={{ maxWidth: '150px' }}
            className="MT20"
            onClick={() => resetAndBackProps()}
          >
            Quay lại
          </Button>
        </div>
      ) : (
        <div className="bookingform">
          <div
            style={{
              maxHeight: '80vh',
              overflowX: 'hidden',
              overflowY: 'scroll',
            }}
            className={'dayBooking-box' + (!isHideDayColumn ? ' show' : '')}
          >
            {dayBooking.map((dayItem, dayIndex) => (
              <div
                key={dayIndex}
                className="day-box"
                onClick={() => onChooseDay(dayItem)}
                style={
                  choosenDayCode && choosenDayCode === dayItem.dayCode
                    ? { borderColor: 'black', opacity: 1 }
                    : choosenDayCode && choosenDayCode !== dayItem.dayCode
                      ? { opacity: 0.4 }
                      : {}
                }
              >
                <span className="text day-name">
                  {dayIndex === 0
                    ? 'Hôm nay'
                    : translationDate(dayItem.dayName)}
                </span>
                <span className="text day-txt">{dayItem.date}</span>
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
              isStopped={false}
              isPaused={false}
            />
          </div>

          <div className="timeBooking-box">
            {bookingOptionValue === 7 ? (
              <div className="justity-center align-center">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '90%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    width={70}
                    src={'@images/Icon/logoHeaderWhite.svg'}
                    style={{ objectFit: 'contain' }}
                    alt="logo"
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '85%',
                    margin: '30px 5% 0 5%',
                  }}
                >
                  <p className="text day-txt">
                    Hiện tại tính năng đặt lịch ký gửi trên website đang tạm
                    khoá.
                  </p>
                  <p className="text day-txt">
                    Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm
                    thông tin.
                  </p>
                  <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      style={{ maxWidth: '150px' }}
                      className="MT20"
                      onClick={() => resetAndBackProps()}
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={
                    bookingOptionValue === 9
                      ? { gridTemplateColumns: 'auto auto auto' }
                      : { gridTemplateColumns: 'auto auto' }
                  }
                  className={
                    'timeBooking-grid' +
                    (step === 1 && isHideUserForm ? ' show' : '')
                  }
                >
                  {timeBooking.map((itemTime, indexTime) => {
                    const isReady =
                      !bookingDataCode.includes(
                        choosenTimeCode + choosenDayCode
                      ) && itemTime.timeCode === choosenTimeCode;
                    const isBusy = bookingDataCode.includes(
                      itemTime.timeCode + choosenDayCode
                    );

                    return (
                      <div
                        style={
                          isBusy
                            ? { pointerEvents: 'none', cursor: 'none' }
                            : {}
                        }
                        onClick={() => !isBusy && onChooseTime(itemTime)}
                        key={indexTime}
                        className={
                          'time-box' +
                          (isReady ? ' ready' : isBusy ? ' busy' : '')
                        }
                      >
                        <span className="text">{itemTime.timeName}</span>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={
                    'explain-box' +
                    (step === 1 && isHideUserForm ? ' show' : '')
                  }
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

                <div
                  className={
                    'timeBooking-footer' +
                    ((step === 1 || step === 0) && isHideUserForm
                      ? ' show'
                      : '')
                  }
                >
                  <span
                    onClick={() => resetAndBackProps(false)}
                    className="text"
                  >{`< Quay lại`}</span>
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
                      {`Tiếp tục >`}
                    </span>
                  )}
                </div>
              </>
            )}

            <Form {...form}>
              <form
                className={
                  'w-[80%] timeBooking-form' +
                  (!isHideUserForm && step === 2 ? ' show' : '')
                }
                onSubmit={form.handleSubmit(onConsign)}
              >
                <div className="flex flex-col gap-4 sell-card-form justify-center">
                  <div className="flex items-center gap-2">
                    <Label className="w-32">Thời gian</Label>
                    <Input
                      value={convertCodeToTime()}
                      readOnly
                      placeholder="..."
                      className="flex-1"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="w-32">Họ và Tên</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="..."
                            className="flex-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="w-32">Số điện thoại</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="..."
                            className="flex-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfProduct"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="w-32">
                          Số lượng Hàng Hoá
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="..."
                            className="w-24"
                            onChange={e => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                              setIsErrorMax(value > 50);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {formValues.numberOfProduct < 5 && (
                    <p className="text-red-500 text-sm">
                      Số lượng ký gửi tối thiểu là 5 món. Tuy nhiên, nếu anh/chị
                      ký gửi sản phẩm luxury (giá trị ký gửi trên 5.000.000đ).
                      Vui lòng liên hệ hotline 0703334443 để được hỗ trợ tốt
                      nhất.
                    </p>
                  )}

                  {isErrorMax && (
                    <p className="text-red-500 text-sm">
                      Với số lượng hàng hoá trên 50, Xin vui lòng liên hệ
                      hotline 0703334443 để được hỗ trợ tốt nhất.
                    </p>
                  )}

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
                      disabled={
                        isErrorMax ||
                        formValues.numberOfProduct < 5 ||
                        formValues.numberOfProduct > 100 ||
                        isConsigning
                      }
                    >
                      {isConsigning ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            <div
              className={
                'timeBooking-confirm' +
                (isHideUserForm && step === 3 ? ' show' : '')
              }
            >
              <Lottie
                options={defaultOptionsSuccess}
                height={150}
                width={150}
                isStopped={false}
                isPaused={false}
              />
              <div className="flex justify-center">
                <div className="w-4/5">
                  <div className="space-y-2">
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
              </div>
              <Button className="MT20" onClick={() => resetAndBackProps(true)}>
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* <MyModal ref={myModal} /> */}
    </div>
  );
};

export default ConsignmentScreen;
