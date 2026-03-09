import React from 'react';
import { withRouter } from 'next/router';
import { connect } from 'react-redux';
import { Input, Button, Descriptions, Select, Checkbox } from 'antd';
import { images } from 'config/images';
import MyModal from 'pages/Components/MyModal';
import { showNotification } from 'common/function';
import './style.scss';
import GapService from 'controller/Api/Services/Gap';
import { LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import rightArrowJson from 'static/Assets/Image/Lottie/rightArrow.json';
import Lottie from 'react-lottie';
import { bindActionCreators } from 'redux';
import StorageActions from 'controller/Redux/actions/storageActions';
import {
  BOOKING_OPTION_CUSTOM_EACH_DAY,
  BOOKING_OPTION_EACH_DAY,
  BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
  TIME_BOOKING,
  WORKING_DAY_COUNT,
} from 'common/constants';
const { Option } = Select;
class TableAppointment extends React.Component {
  static async getInitialProps({ query }) {
    return { query };
  }
  constructor(props) {
    super(props);
    this.state = {
      dayBooking: [],
      formData: {
        customerName: '',
        phoneNumber: '',
        numberOfProduct: 1,
      },
      timeBooking: [
        {
          timeName: '10:00',
          timeCode: '1000',
        },
        {
          timeName: '11:00',
          timeCode: '1100',
        },
        {
          timeName: '13:30',
          timeCode: '1330',
        },
        {
          timeName: '14:30',
          timeCode: '1430',
        },
        {
          timeName: '15:30',
          timeCode: '1530',
        },
        {
          timeName: '16:30',
          timeCode: '1630',
        },
        {
          timeName: '17:30',
          timeCode: '1730',
        },
        {
          timeName: '18:30',
          timeCode: '1830',
        },
      ],
      step: 0,
      isHideUserForm: true,
      isHideDayColumn: false,
      choosenDayCode: null,
      choosenTimeCode: null,
      bookingDataCode: [],
      isLoadingBooking: false,
      isShowEightSlot: true,
      inputValue: '',
      searchInfo: '',
      isLast7Day: false,
      bookingOptionValue: 8,
      bookingOptionEachDay: {},
      workingDayCount: 14,
      bookingCustomOptionString: undefined,
    };
    this.myModal = React.createRef();
  }

  async componentDidMount() {
    const { settingRedux } = this.props;
    let dayBookingCount = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    let dayBookingTemp = [];
    let bookingOptionEachDay =
      settingRedux.BOOKING_OPTION_EACH_DAY ||
      BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

    dayBookingCount.map((item, index) => {
      dayBookingTemp.push({
        dayName: moment().add(index, 'day').format('dddd'),
        date: moment().add(index, 'day').format('DD-MM-YYYY'),
        dayCode: moment()
          .add(index, 'day')
          .format('DD-MM-YYYY')
          .replaceAll('-', ''),
      });
    });

    const choosenDayCode =
      dayBookingTemp && dayBookingTemp[0] ? dayBookingTemp[0].dayCode : '';
    const { option, timeBooking } = this.checkDayCodeToBookingOption(
      dayBookingTemp[0],
      bookingOptionEachDay
    );
    // console.log('timeBooking')
    // console.log(timeBooking)
    // console.log(option)
    // console.log(settingRedux)

    // const bookingOptionList = { ...bookingOptionEachDay }
    // bookingOptionList[`OPTION_${8}`] = bookingOptionList[`OPTION_${8}`] + `--24052022----25052022----25052022----26052022----27052022----28052022----29052022----30052022----31052022----01062022---02062022---03062022---04062022---05062022---06062022---07062022--`
    // console.log('bookingOptionList')
    // console.log(bookingOptionList)

    // let res = await GapService.updateSettingWithKeyAndValue(BOOKING_OPTION_EACH_DAY, bookingOptionList)
    // console.log(res)

    let workingDayCountTemp = 14;

    if (settingRedux.WORKING_DAY_COUNT) {
      workingDayCountTemp = settingRedux.WORKING_DAY_COUNT;
    }

    let bookingCustomOptionString = 'default';

    if (
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY &&
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDayCode]
    ) {
      bookingCustomOptionString =
        settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDayCode];
    }

    this.setState(
      {
        bookingCustomOptionString: bookingCustomOptionString,
        bookingOptionValue: option,
        timeBooking: timeBooking,
        bookingOptionEachDay: bookingOptionEachDay,
        choosenDayCode: choosenDayCode,
        dayBooking: dayBookingTemp,
        workingDayCount: workingDayCountTemp,
      },
      async () => {
        await this.fetchAppointment();
      }
    );
  }

  checkDayCodeToBookingOption = (
    choosenDayCode,
    bookingOptionData = BOOKING_OPTION_EACH_DAY_DATA_DEFAULT
  ) => {
    if (choosenDayCode && choosenDayCode.dayCode && bookingOptionData) {
      if (
        bookingOptionData.OPTION_1 &&
        bookingOptionData.OPTION_1.includes(choosenDayCode.dayCode)
      )
        return { option: 1, timeBooking: TIME_BOOKING.OPTION_1 };
      else if (
        bookingOptionData.OPTION_2 &&
        bookingOptionData.OPTION_2.includes(choosenDayCode.dayCode)
      )
        return { option: 2, timeBooking: TIME_BOOKING.OPTION_2 };
      else if (
        bookingOptionData.OPTION_3 &&
        bookingOptionData.OPTION_3.includes(choosenDayCode.dayCode)
      )
        return { option: 3, timeBooking: TIME_BOOKING.OPTION_3 };
      else if (
        bookingOptionData.OPTION_4 &&
        bookingOptionData.OPTION_4.includes(choosenDayCode.dayCode)
      )
        return { option: 4, timeBooking: TIME_BOOKING.OPTION_4 };
      else if (
        bookingOptionData.OPTION_5 &&
        bookingOptionData.OPTION_5.includes(choosenDayCode.dayCode)
      )
        return { option: 5, timeBooking: TIME_BOOKING.OPTION_5 };
      else if (
        bookingOptionData.OPTION_6 &&
        bookingOptionData.OPTION_6.includes(choosenDayCode.dayCode)
      )
        return { option: 6, timeBooking: TIME_BOOKING.OPTION_6 };
      else if (
        bookingOptionData.OPTION_7 &&
        bookingOptionData.OPTION_7.includes(choosenDayCode.dayCode)
      )
        return { option: 7, timeBooking: TIME_BOOKING.OPTION_7 };
      else if (
        bookingOptionData.OPTION_8 &&
        bookingOptionData.OPTION_8.includes(choosenDayCode.dayCode)
      )
        return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
      else if (
        bookingOptionData.OPTION_9 &&
        bookingOptionData.OPTION_9.includes(choosenDayCode.dayCode)
      )
        return { option: 9, timeBooking: TIME_BOOKING.OPTION_9 };
      else return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
    } else {
      return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
    }
  };

  fetchAppointment = async () => {
    const { dayBooking } = this.state;

    this.setState(
      {
        isLoadingBooking: true,
      },
      async () => {
        const arrayDate = [];
        let bookingDataCode = '';
        dayBooking.map((itemDate, indexdate) => {
          arrayDate.push(`"${itemDate.date}"`);
        });

        const res = await GapService.getAppointmentWithDate(arrayDate);

        console.log('res');
        console.log(res);
        console.log(res);

        if (res && res.results) {
          res.results.map((itemData, indexItem) => {
            if (itemData && itemData.slot) {
              bookingDataCode += '-' + itemData.slot + '-';
            }
          });

          console.log('res');
          console.log(res);
          console.log(bookingDataCode);

          this.setState({
            bookingUserInfo: res.results,
            bookingDataCode: bookingDataCode,
            isLoadingBooking: false,
          });
        } else {
          this.setState({
            isLoadingBooking: false,
          });

          showNotification('Không thể tải dữ liệu!');
        }
      }
    );
  };

  translationDate = key => {
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

  onChooseDay = (choosenDay, isLast7Day = false) => {
    const { bookingOptionEachDay } = this.state;
    const { settingRedux } = this.props;

    console.log('onChooseDay', choosenDay);
    console.log('bookingOptionEachDay', bookingOptionEachDay);
    console.log(
      'bookingCustomOptionString',
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY
    );

    const { option, timeBooking } = this.checkDayCodeToBookingOption(
      choosenDay,
      bookingOptionEachDay
    );
    // console.log(option)
    // console.log(choosenDay)
    // console.log(bookingOptionEachDay)

    let bookingCustomOptionString = 'default';

    if (
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY &&
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode]
    ) {
      bookingCustomOptionString =
        settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode];
    }

    console.log('this bookingCustomOptionString', bookingCustomOptionString);

    this.setState({
      bookingCustomOptionString: bookingCustomOptionString,
      bookingOptionValue: option,
      timeBooking: timeBooking,
      isLast7Day: isLast7Day,
      choosenTimeCode: null,
      choosenDayCode: choosenDay ? choosenDay.dayCode : '',
    });
  };

  onChooseTime = choosenTime => {
    // console.log('choosenTime')
    // console.log(choosenTime)

    this.setState(
      {
        step: 1,
        choosenTimeCode: choosenTime ? choosenTime.timeCode : '',
      },
      () => {
        this.myModal.current.openModal(this.renderInfoAppointment(), {
          closable: true,
        });
      }
    );
  };

  onChangeWorkingDayOption = async (value = 1) => {
    const { settingRedux, setSetting } = this.props;
    const { dayBooking, bookingOptionEachDay } = this.state;

    this.setState({
      isLoadingBooking: true,
    });

    let res = await GapService.updateSettingWithKeyAndValue(
      WORKING_DAY_COUNT,
      value
    );

    if (res.code === 101 || res.error) {
      showNotification('Thay đổi không thành công');
      this.setState({
        isLoadingBooking: false,
      });
    } else {
      this.setState({
        bookingOptionValue: null,
        timeBooking: null,
        workingDayCount: value,
        isLoadingBooking: false,
        choosenDayCode: null,
        isLast7Day: null,
        choosenTimeCode: null,
      });
      const settingReduxTemp = { ...settingRedux };
      settingReduxTemp.WORKING_DAY_COUNT = value;
      console.log(settingReduxTemp);
      setSetting(settingReduxTemp);
      showNotification('Thay đổi thành công');
    }
  };

  onChangeBookingOption = async (value = 1) => {
    const { choosenDayCode } = this.state;
    const { settingRedux, setSetting } = this.props;
    let bookingOptionEachDay = settingRedux.BOOKING_OPTION_EACH_DAY;

    const bookingOptionList = { ...bookingOptionEachDay };
    bookingOptionList.OPTION_1 = bookingOptionList.OPTION_1
      ? bookingOptionList.OPTION_1.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_2 = bookingOptionList.OPTION_2
      ? bookingOptionList.OPTION_2.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_3 = bookingOptionList.OPTION_3
      ? bookingOptionList.OPTION_3.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_4 = bookingOptionList.OPTION_4
      ? bookingOptionList.OPTION_4.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_5 = bookingOptionList.OPTION_5
      ? bookingOptionList.OPTION_5.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_6 = bookingOptionList.OPTION_6
      ? bookingOptionList.OPTION_6.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_7 = bookingOptionList.OPTION_7
      ? bookingOptionList.OPTION_7.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_8 = bookingOptionList.OPTION_8
      ? bookingOptionList.OPTION_8.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList.OPTION_9 = bookingOptionList.OPTION_9
      ? bookingOptionList.OPTION_9.replaceAll(choosenDayCode, '-')
      : '-';
    bookingOptionList[`OPTION_${value}`] =
      bookingOptionList[`OPTION_${value}`] + `--${choosenDayCode}--`;
    let res = await GapService.updateSettingWithKeyAndValue(
      BOOKING_OPTION_EACH_DAY,
      bookingOptionList
    );

    console.log(value);
    console.log(bookingOptionList);
    console.log(res);
    if (res.code === 101 || res.error) {
      showNotification('Thay đổi không thành công');
    } else {
      this.setState({
        timeBooking: TIME_BOOKING[`OPTION_${value}`],
        bookingOptionValue: value,
        bookingOptionEachDay: bookingOptionList,
      });
      const settingReduxTemp = { ...settingRedux };
      settingReduxTemp.BOOKING_OPTION_EACH_DAY = bookingOptionList;
      console.log(settingReduxTemp);
      setSetting(settingReduxTemp);
      showNotification('Thay đổi thành công');
    }
  };

  onSelectTimeBooking = async (selectedTimeCode, isOn = true) => {
    const { choosenDayCode, timeBooking } = this.state;
    const { settingRedux, setSetting } = this.props;
    let bookingOptionCustomEachDay =
      settingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY;
    const bookingCustomOptionList = { ...bookingOptionCustomEachDay };
    let isExistCustomThisDay = false;

    if (
      bookingOptionCustomEachDay &&
      bookingOptionCustomEachDay[choosenDayCode]
    ) {
      isExistCustomThisDay = true;
    }

    let acceptedCustomTimeCodeString = '';
    if (!isExistCustomThisDay) {
      let acceptedCustomTimeCodeString = '';
      if (!isOn) {
        timeBooking.map(itemItem => {
          acceptedCustomTimeCodeString += `-${selectedTimeCode === itemItem.timeCode ? '-' : itemItem.timeCode}-`;
        });
      }

      console.log('acceptedCustomTimeCodeString', acceptedCustomTimeCodeString);

      bookingCustomOptionList[choosenDayCode] = acceptedCustomTimeCodeString;
    } else {
      acceptedCustomTimeCodeString = bookingOptionCustomEachDay[choosenDayCode];

      if (!isOn) {
        acceptedCustomTimeCodeString = acceptedCustomTimeCodeString.replaceAll(
          selectedTimeCode,
          '-'
        );
      } else {
        acceptedCustomTimeCodeString += `-${selectedTimeCode}-`;
      }

      console.log('acceptedCustomTimeCodeString', acceptedCustomTimeCodeString);

      bookingCustomOptionList[choosenDayCode] = acceptedCustomTimeCodeString;
    }

    console.log('bookingOptionCustomEachDay', bookingOptionCustomEachDay);
    console.log('isExistCustomThisDay', isExistCustomThisDay);

    console.log('selectedTimeCode', selectedTimeCode);
    console.log('timeBooking', timeBooking);
    console.log('choosenDayCode', choosenDayCode);
    console.log('isOn', isOn);
    console.log('bookingCustomOptionList', bookingCustomOptionList);

    let res = await GapService.updateSettingWithKeyAndValue(
      BOOKING_OPTION_CUSTOM_EACH_DAY,
      bookingCustomOptionList
    );

    if (res.code === 101 || res.error) {
      showNotification('Thay đổi không thành công');
    } else {
      this.setState(
        {
          bookingCustomOptionList: bookingCustomOptionList,
          bookingCustomOptionString:
            acceptedCustomTimeCodeString ||
            this.state.bookingCustomOptionString,
        },
        () => {
          const settingReduxTemp = { ...settingRedux };
          settingReduxTemp.BOOKING_OPTION_CUSTOM_EACH_DAY =
            bookingCustomOptionList;
          console.log(settingReduxTemp);
          setSetting(settingReduxTemp);
          showNotification('Thay đổi thành công');
        }
      );
    }
  };

  renderInfoAppointment = () => {
    const {
      bookingUserInfo,
      choosenTimeCode,
      choosenDayCode,
      bookingDataCode,
    } = this.state;
    let findUser = bookingUserInfo.filter(user => {
      return user.slot === choosenTimeCode + choosenDayCode;
    });
    console.log('renderInfoAppointment');
    console.log(findUser[0]);
    console.log(choosenTimeCode);
    console.log(bookingUserInfo);
    if (findUser && findUser[0] && findUser[0].objectId) {
      const deleteAppointment = async () => {
        const res = await GapService.deleteAppointmentWithSlotId(
          findUser[0].objectId
        );

        console.log('res');
        console.log(res);

        if (res.code === 101 || res.error) {
          showNotification('Xoá không thành công');
          this.closeModal();
        } else {
          showNotification('Xoá thành công');
          this.closeModal();
          const bookingDataCodeTemp = bookingDataCode.replace(
            choosenTimeCode + choosenDayCode,
            ''
          );
          this.setState({
            choosenTimeCode: null,
            bookingDataCode: bookingDataCodeTemp,
          });
        }
      };

      return (
        <div>
          <span className="text text-title">Thông tin lịch hẹn</span>
          <Descriptions className="MT10">
            <Descriptions.Item span={24} label="Tên Khách Hàng">
              {findUser[0].customerName}
            </Descriptions.Item>
            <Descriptions.Item span={24} label="Số lượng Hàng Hoá">
              {findUser[0].numberOfProduct}
            </Descriptions.Item>
            <Descriptions.Item span={24} label="Số điện thoại">
              {findUser[0].phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item span={24} label="Đã đặt lúc">
              {moment(findUser[0].createdAt).format('HH:MM DD/MM/YYYY')}
            </Descriptions.Item>
          </Descriptions>

          <Button onClick={this.closeModal}>Quay lại</Button>

          <Button className="ML10" onClick={deleteAppointment}>
            Xoá
          </Button>
        </div>
      );
    } else {
      showNotification('Không tìm thấy thông tin');
    }
  };

  closeModal = () => {
    this.myModal.current.closeModal();
  };

  convertCodeToTime = () => {
    const { choosenTimeCode, choosenDayCode } = this.state;

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

  handleInputChange = e => {
    this.setState({ inputValue: e.target.value });
  };

  handleInputConfirm = async () => {
    const { inputValue } = this.state;
    console.log('handleInputConfirm');
    console.log(inputValue);
    const formatedValue = `${inputValue.trim()}`;
    const res = await GapService.getAppointmentWithPhone(formatedValue);
    if (res && res.results && res.results[0]) {
      console.log('handleInputConfirm - res');
      console.log(res);
      this.setState({
        searchInfo: `Tên: ${res.results[0].customerName}\nSdt: ${res.results[0].phoneNumber}\nĐặt lịch ngày: ${res.results[0].date}\nThời gian: ${res.results[0].dateTime}`,
      });
    } else {
      this.setState({
        searchInfo: `Không có thông tin`,
      });
    }
  };

  renderOptionewWorkingDay = () => {
    return (
      <>
        <Option value={14}>{`Mặc định 14 ngày`}</Option>
        <Option value={1}>{'1 ngày'}</Option>
        <Option value={2}>{'2 ngày'}</Option>
        <Option value={3}>{'3 ngày'}</Option>
        <Option value={4}>{'4 ngày'}</Option>

        <Option value={5}>{'5 ngày'}</Option>
        <Option value={6}>{'6 ngày'}</Option>
        <Option value={7}>{'7 ngày'}</Option>
      </>
    );
  };

  renderOptionBooking = () => {
    const { isLast7Day, choosenDayCode, bookingOptionEachDay } = this.state;

    if (isLast7Day) {
      return (
        <>
          <Option value={1}>{'Full ngày - 30 phút'}</Option>
          <Option value={2}>{'Full ngày - 1 tiếng'}</Option>
          <Option value={3}>{'Sáng 30 phút'}</Option>
          <Option value={4}>{'Sáng 1 tiếng'}</Option>
          <Option value={5}>{'Chiều 30 phút'}</Option>
          <Option value={6}>{'Chiều 1 tiếng'}</Option>
          <Option value={7}>{'Off nghỉ!'}</Option>
          <Option value={8}>{'Định dạng cũ'}</Option>
          <Option value={9}>{'Full ngày - 15 phút'}</Option>
        </>
      );
    } else {
      const { option, timeBooking } = this.checkDayCodeToBookingOption(
        { dayCode: choosenDayCode },
        bookingOptionEachDay
      );

      switch (option) {
        case 1:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
            </>
          );
        case 2:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={2}>{'Full ngày - 1 tiếng'}</Option>
            </>
          );
        case 3:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={3}>{'Sáng 30 phút'}</Option>
            </>
          );
        case 4:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={2}>{'Full ngày - 1 tiếng'}</Option>
              <Option value={3}>{'Sáng 30 phút'}</Option>
              <Option value={4}>{'Sáng 1 tiếng'}</Option>
            </>
          );
        case 5:
          return (
            <>
              <Option value={5}>{'Chiều 30 phút'}</Option>
            </>
          );
        case 6:
          return (
            <>
              <Option value={5}>{'Chiều 30 phút'}</Option>
              <Option value={6}>{'Chiều 1 tiếng'}</Option>
            </>
          );
        case 7:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={2}>{'Full ngày - 1 tiếng'}</Option>
              <Option value={3}>{'Sáng 30 phút'}</Option>
              <Option value={4}>{'Sáng 1 tiếng'}</Option>
              <Option value={5}>{'Chiều 30 phút'}</Option>
              <Option value={6}>{'Chiều 1 tiếng'}</Option>
              <Option value={7}>{'Off nghỉ!'}</Option>
              <Option value={8}>{'Định dạng cũ'}</Option>
            </>
          );
        case 8:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={8}>{'Định dạng cũ'}</Option>
            </>
          );
        case 9:
          return (
            <>
              <Option value={7}>{'Off nghỉ!'}</Option>
            </>
          );
        default:
          return (
            <>
              <Option value={1}>{'Full ngày - 30 phút'}</Option>
              <Option value={2}>{'Full ngày - 1 tiếng'}</Option>
              <Option value={3}>{'Sáng 30 phút'}</Option>
              <Option value={4}>{'Sáng 1 tiếng'}</Option>
              <Option value={5}>{'Chiều 30 phút'}</Option>
              <Option value={6}>{'Chiều 1 tiếng'}</Option>
              <Option value={7}>{'Off nghỉ!'}</Option>
              <Option value={8}>{'Định dạng cũ'}</Option>
            </>
          );
      }
      // 1 -> 1
      // 2 -> 2,1
      // 3 -> 3, 1
      // 4 -> 4,3,2,1
      // 5 -> 5, 1
      // 6 -> 6,5
      // 7 -> all
      // 8 -> 1
    }
  };

  render() {
    const {
      step,
      dayBooking,
      choosenDayCode,
      timeBooking,
      bookingDataCode,
      isErrorMax,
      isLast7Day,
      bookingOptionValue,
      choosenTimeCode,
      formData,
      isHideUserForm,
      isConsigning,
      isHideDayColumn,
      isLoadingBooking,
      isShowEightSlot,
      searchInfo,
      bookingCustomOptionString,
    } = this.state;

    const { settingRedux } = this.props;

    const defaultOptionsRightArrow = {
      loop: true,
      autoplay: true,
      animationData: rightArrowJson,
    };

    return (
      <>
        <div className="TableAppointment-home-container">
          <div className="bookingform">
            <div
              style={{
                overflowX: 'hidden',
                overflowY: 'scroll',
                position: 'relative',
              }}
              className={'dayBooking-box show'}
            >
              {dayBooking.map((dayItem, dayIndex) => {
                const isLast7Day = dayIndex >= this.state.workingDayCount;
                return (
                  <div
                    key={dayIndex}
                    className={'day-box'}
                    onClick={() => this.onChooseDay(dayItem, isLast7Day)}
                    style={
                      choosenDayCode && choosenDayCode === dayItem.dayCode
                        ? isLast7Day
                          ? { borderColor: 'green', opacity: 1 }
                          : { borderColor: 'black', opacity: 1 }
                        : choosenDayCode && choosenDayCode !== dayItem.dayCode
                          ? { opacity: 0.4 }
                          : {}
                    }
                  >
                    <span
                      className="text day-name"
                      style={isLast7Day ? { color: 'green' } : {}}
                    >
                      {dayIndex === 0
                        ? 'Hôm nay'
                        : this.translationDate(dayItem.dayName)}
                    </span>
                    <span
                      className="text day-txt"
                      style={isLast7Day ? { color: 'green' } : {}}
                    >
                      {dayItem.date}
                    </span>
                  </div>
                );
              })}

              <Lottie
                style={{
                  transform: `rotate(90deg)`,
                  position: 'absolute',
                  bottom: 0,
                  right: '-30px',
                  zoom: 0.8,
                }}
                options={defaultOptionsRightArrow}
                height={90}
                width={90}
                speed={1}
                isStopped={false}
                isPaused={false}
              />
            </div>

            <div className="timeBooking-box">
              <div
                style={
                  bookingOptionValue === 9
                    ? { gridTemplateColumns: 'auto auto auto' }
                    : isShowEightSlot
                      ? { gridTemplateColumns: 'auto auto' }
                      : {}
                }
                className={'timeBooking-grid show'}
              >
                {isLoadingBooking ? (
                  <div className="flex justity-center align-center">
                    <LoadingOutlined width={60} height={60} />
                  </div>
                ) : bookingOptionValue === 7 ? (
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
                        src={images.logoHeaderWhite}
                        style={{ objectFit: 'contain' }}
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
                      <p className="text day-txt">
                        Xin lỗi vì sự bất tiện này.
                      </p>
                    </div>
                  </div>
                ) : timeBooking ? (
                  timeBooking.map((itemTime, indexTime) => {
                    const isReady =
                      !bookingDataCode.includes(
                        choosenTimeCode + choosenDayCode
                      ) && itemTime.timeCode === choosenTimeCode;
                    const isBusy = bookingDataCode.includes(
                      itemTime.timeCode + choosenDayCode
                    );
                    // console.log(bookingDataCode)
                    // console.log(itemTime.timeCode + choosenDayCode)
                    // console.log(isReady)
                    // console.log(isBusy)

                    return (
                      <div key={indexTime} style={{ display: 'flex' }}>
                        <Checkbox
                          checked={
                            bookingCustomOptionString === 'default'
                              ? true
                              : bookingCustomOptionString?.includes(
                                  itemTime.timeCode
                                )
                          }
                          style={{ marginBottom: '5px' }}
                          defaultChecked
                          onChange={e => {
                            this.onSelectTimeBooking(
                              itemTime.timeCode,
                              e.target.checked
                            );
                          }}
                        />
                        <div
                          style={
                            !isBusy
                              ? { pointerEvents: 'none', cursor: 'none' }
                              : {}
                          }
                          onClick={() =>
                            isBusy ? this.onChooseTime(itemTime) : {}
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
          <MyModal ref={this.myModal} />
        </div>
        <div className="search-info-user-booking-box">
          <span>Tra cứu qua SĐT:</span>
          <Input
            onChange={this.handleInputChange}
            maxLength={12}
            size="small"
            ref={this.saveInputRef}
            style={{
              margin: '15px 0px',
              width: '100%',
              height: 40,
              maxWidth: '300px',
            }}
            placeholder="..."
          />
          <Button onClick={this.handleInputConfirm} className="MT5">
            OK
          </Button>
          {searchInfo && (
            <span className="MT10" style={{ whiteSpace: 'pre-wrap' }}>
              {searchInfo}
            </span>
          )}
        </div>

        <div className="select-booking-option-box">
          <div className="flex align-center">
            <div
              className={`${isLast7Day ? 'status-on' : 'status-off'} MR3 MB4`}
            />
            <span className="MB3">
              {isLast7Day
                ? 'Khung thời gian hoạt động'
                : 'Hiện đang hoạt động:'}
            </span>
          </div>
          <Select
            onChange={this.onChangeBookingOption}
            value={bookingOptionValue}
            defaultValue={bookingOptionValue}
            size="large"
            id="bookingOption"
            key="bookingOption"
            placeholder="..."
          >
            {this.renderOptionBooking()}
          </Select>
        </div>

        <div className="select-booking-option-box">
          <div className="flex align-center">
            <div className={`status-on MR3 MB4`} />
            <span className="MB3">{`Số ngày làm việc`}</span>
          </div>
          <Select
            onChange={this.onChangeWorkingDayOption}
            value={this.state.workingDayCount}
            defaultValue={14}
            size="large"
            id="workingOption"
            key="workingOption"
            placeholder="..."
          >
            {this.renderOptionewWorkingDay()}
          </Select>
        </div>
      </>
    );
  }
}

// 2 -> 1
// 3 -> 1
// 4 -> 3,2,1
// 5 ->
// 6 -> 6
// 7 -> all
// 8 -> 1

const mapStateToProps = state => ({
  locale: state.locale,
  userData: state.userData,
  settingRedux: state.settingRedux,
});

const mapDispatchToProps = dispatch => {
  return {
    setSetting: bindActionCreators(StorageActions.setSetting, dispatch),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(TableAppointment)
);
