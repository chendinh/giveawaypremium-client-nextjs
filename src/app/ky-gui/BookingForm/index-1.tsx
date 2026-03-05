// import React from 'react';
// import { Router } from 'common/routes';
// import ReduxServices from 'common/redux';
// import { connect } from 'react-redux';
// import { withRouter } from 'next/router';
// import { images } from 'config/images';
// import { isMobile } from 'react-device-detect';
// import MyModal from 'pages/Components/MyModal';
// import moment from 'moment';
// import GapService from 'controller/Api/Services/Gap';
// import {
//   Form,
//   Row,
//   Col,
//   Input,
//   Button,
//   Descriptions,
//   Divider,
//   DatePicker,
//   Select,
// } from 'antd';
// import Lottie from 'react-lottie';
// import successJson from 'static/Assets/Image/Lottie/success.json';
// import rightArrowJson from 'static/Assets/Image/Lottie/rightArrow.json';

// import './style.scss';
// import { showNotification } from 'common/function';
// import {
//   BOOKING_OPTION_EACH_DAY_DATA_DEFAULT,
//   TIME_BOOKING,
// } from 'common/constants';

// class ConsignmentScreen extends React.PureComponent {
//   static async getInitialProps({ query }) {
//     return { query };
//   }
//   constructor(props) {
//     super(props);
//     this.state = {
//       dayBooking: [],
//       formData: {
//         customerName: '',
//         phoneNumber: '',
//         numberOfProduct: 5,
//       },
//       timeBooking: [],
//       // timeBooking: [
//       //   {
//       //     timeName: '10:00',
//       //     timeCode: '1000'
//       //   },
//       //   {
//       //     timeName: '11:00',
//       //     timeCode: '1100'
//       //   },
//       //   {
//       //     timeName: '13:30',
//       //     timeCode: '1330'
//       //   },
//       //   {
//       //     timeName: '14:30',
//       //     timeCode: '1430'
//       //   },
//       //   {
//       //     timeName: '15:30',
//       //     timeCode: '1530'
//       //   },
//       //   {
//       //     timeName: '16:30',
//       //     timeCode: '1630'
//       //   },
//       //   {
//       //     timeName: '17:30',
//       //     timeCode: '1730'
//       //   },
//       //   {
//       //     timeName: '18:30',
//       //     timeCode: '1830'
//       //   }
//       // ],
//       step: 0,
//       errorSlotInfo: null,
//       isHideUserForm: true,
//       isHideDayColumn: false,
//       choosenDayCode: null,
//       choosenTimeCode: null,
//       bookingDataCode: [],
//       isErrorMax: false,
//       isShowEightSlot: true,
//       bookingOptionValue: 8,
//       bookingOptionEachDay: {},
//       workingDayCount: 14,
//       bookingCustomOptionString: undefined,
//     };
//     this.myModal = React.createRef();
//   }

//   async componentDidMount() {
//     const newSettingRedux = await ReduxServices.getSetting();
//     let workingDayCountTemp = 14;

//     if (newSettingRedux.WORKING_DAY_COUNT) {
//       workingDayCountTemp = newSettingRedux.WORKING_DAY_COUNT;
//     }

//     let dayBookingCount = [];

//     for (let i = 0; i < workingDayCountTemp; i++) {
//       dayBookingCount.push('');
//     }

//     let dayBookingTemp = [];
//     let bookingOptionEachDay =
//       newSettingRedux.BOOKING_OPTION_EACH_DAY ||
//       BOOKING_OPTION_EACH_DAY_DATA_DEFAULT;

//     dayBookingCount.map((item, index) => {
//       dayBookingTemp.push({
//         dayName: moment().add(index, 'day').format('dddd'),
//         date: moment().add(index, 'day').format('DD-MM-YYYY'),
//         dayCode: moment()
//           .add(index, 'day')
//           .format('DD-MM-YYYY')
//           .replaceAll('-', ''),
//       });
//     });

//     const choosenDayCode =
//       dayBookingTemp && dayBookingTemp[0] ? dayBookingTemp[0].dayCode : '';
//     const { option, timeBooking } = this.checkDayCodeToBookingOption(
//       dayBookingTemp[0],
//       bookingOptionEachDay
//     );

//     let bookingCustomOptionString = 'default';

//     if (
//       newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY &&
//       newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDayCode]
//     ) {
//       bookingCustomOptionString =
//         newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDayCode];
//     }

//     this.setState(
//       {
//         bookingCustomOptionString: bookingCustomOptionString,
//         bookingOptionValue: option,
//         timeBooking: timeBooking,
//         bookingOptionEachDay: bookingOptionEachDay,
//         dayBooking: dayBookingTemp,
//         workingDayCount: workingDayCountTemp,
//       },
//       async () => {
//         await this.fetchAppointment();
//       }
//     );
//   }

//   componentDidUpdate() {}

//   componentWillUnmount() {}

//   checkDayCodeToBookingOption = (
//     choosenDayCode,
//     bookingOptionData = BOOKING_OPTION_EACH_DAY_DATA_DEFAULT
//   ) => {
//     if (choosenDayCode && choosenDayCode.dayCode && bookingOptionData) {
//       if (
//         bookingOptionData.OPTION_1 &&
//         bookingOptionData.OPTION_1.includes(choosenDayCode.dayCode)
//       )
//         return { option: 1, timeBooking: TIME_BOOKING.OPTION_1 };
//       else if (
//         bookingOptionData.OPTION_2 &&
//         bookingOptionData.OPTION_2.includes(choosenDayCode.dayCode)
//       )
//         return { option: 2, timeBooking: TIME_BOOKING.OPTION_2 };
//       else if (
//         bookingOptionData.OPTION_3 &&
//         bookingOptionData.OPTION_3.includes(choosenDayCode.dayCode)
//       )
//         return { option: 3, timeBooking: TIME_BOOKING.OPTION_3 };
//       else if (
//         bookingOptionData.OPTION_4 &&
//         bookingOptionData.OPTION_4.includes(choosenDayCode.dayCode)
//       )
//         return { option: 4, timeBooking: TIME_BOOKING.OPTION_4 };
//       else if (
//         bookingOptionData.OPTION_5 &&
//         bookingOptionData.OPTION_5.includes(choosenDayCode.dayCode)
//       )
//         return { option: 5, timeBooking: TIME_BOOKING.OPTION_5 };
//       else if (
//         bookingOptionData.OPTION_6 &&
//         bookingOptionData.OPTION_6.includes(choosenDayCode.dayCode)
//       )
//         return { option: 6, timeBooking: TIME_BOOKING.OPTION_6 };
//       else if (
//         bookingOptionData.OPTION_7 &&
//         bookingOptionData.OPTION_7.includes(choosenDayCode.dayCode)
//       )
//         return { option: 7, timeBooking: TIME_BOOKING.OPTION_7 };
//       else if (
//         bookingOptionData.OPTION_8 &&
//         bookingOptionData.OPTION_8.includes(choosenDayCode.dayCode)
//       )
//         return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
//       else if (
//         bookingOptionData.OPTION_9 &&
//         bookingOptionData.OPTION_9.includes(choosenDayCode.dayCode)
//       )
//         return { option: 9, timeBooking: TIME_BOOKING.OPTION_9 };
//       else return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
//     } else {
//       return { option: 8, timeBooking: TIME_BOOKING.OPTION_8 };
//     }
//   };

//   fetchAppointment = async () => {
//     const { dayBooking } = this.state;

//     const arrayDate = [];
//     let bookingDataCode = '';
//     dayBooking.map((itemDate, indexdate) => {
//       arrayDate.push(`"${itemDate.date}"`);
//     });

//     const res = await GapService.getAppointmentWithDate(arrayDate);

//     if (res && res.results) {
//       res.results.map((itemData, indexItem) => {
//         if (itemData && itemData.slot) {
//           bookingDataCode += '-' + itemData.slot + '-';
//         }
//       });
//     }

//     this.setState({
//       bookingDataCode: bookingDataCode,
//     });
//   };

//   translationDate = key => {
//     switch (key) {
//       case 'Sunday':
//         return 'Chủ Nhật';
//       case 'Monday':
//         return 'Thứ hai';
//       case 'Tuesday':
//         return 'Thứ ba';
//       case 'Wednesday':
//         return 'Thứ tư';
//       case 'Thursday':
//         return 'Thứ năm';
//       case 'Friday':
//         return 'Thứ sáu';
//       case 'Saturday':
//         return 'Thứ bảy';
//       default:
//         return key;
//     }
//   };

//   onChooseDay = async choosenDay => {
//     const { bookingOptionEachDay } = this.state;
//     const newSettingRedux = await ReduxServices.getSetting();

//     const { option, timeBooking } = this.checkDayCodeToBookingOption(
//       choosenDay,
//       bookingOptionEachDay
//     );

//     let bookingCustomOptionString = 'default';

//     if (
//       newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY &&
//       newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode]
//     ) {
//       bookingCustomOptionString =
//         newSettingRedux.BOOKING_OPTION_CUSTOM_EACH_DAY[choosenDay.dayCode];
//     }

//     this.setState({
//       bookingCustomOptionString: bookingCustomOptionString,
//       bookingOptionValue: option,
//       timeBooking: timeBooking,
//       step: 1,
//       isHideUserForm: true,
//       choosenTimeCode: null,
//       choosenDayCode: choosenDay ? choosenDay.dayCode : '',
//     });
//   };

//   onChooseTime = choosenTime => {
//     this.setState({
//       step: 1,
//       choosenTimeCode: choosenTime ? choosenTime.timeCode : '',
//     });
//   };

//   convertCodeToTime = () => {
//     const { choosenTimeCode, choosenDayCode } = this.state;

//     if (choosenTimeCode && choosenDayCode) {
//       const formatedTime =
//         choosenTimeCode.substring(0, 2) + ':' + choosenTimeCode.substring(2, 4);
//       const formatedDay =
//         choosenDayCode.substring(0, 2) +
//         '-' +
//         choosenDayCode.substring(2, 4) +
//         '-' +
//         choosenDayCode.substring(4, 8);
//       return formatedDay + ' ' + formatedTime;
//     }

//     return '---';
//   };

//   onHandleOpenContent = () => {};

//   onConsign = async () => {
//     const { formData, choosenDayCode, choosenTimeCode, bookingDataCode } =
//       this.state;

//     if (choosenTimeCode && choosenDayCode) {
//       this.setState(
//         {
//           isConsigning: true,
//         },
//         async () => {
//           const formatedTime =
//             choosenTimeCode.substring(0, 2) +
//             ':' +
//             choosenTimeCode.substring(2, 4);
//           const formatedDay =
//             choosenDayCode.substring(0, 2) +
//             '-' +
//             choosenDayCode.substring(2, 4) +
//             '-' +
//             choosenDayCode.substring(4, 8);
//           const slotID = choosenTimeCode + choosenDayCode;
//           const bookingDataCode =
//             this.state.bookingDataCode + '-' + slotID + '-';
//           const resWithPhone = await GapService.getAppointmentWithPhone(
//             formData.phoneNumber
//           );

//           let isExistPhoneNumber = false;
//           let errorSlotInfo = null;
//           if (
//             resWithPhone &&
//             resWithPhone.results &&
//             resWithPhone.results.length > 0
//           ) {
//             resWithPhone.results.map(item => {
//               if (item.date === formatedDay) {
//                 isExistPhoneNumber = true;
//                 errorSlotInfo = {
//                   customerName: item.customerName,
//                   date: item.date,
//                   dateTime: item.dateTime,
//                   phoneNumber: item.phoneNumber,
//                 };
//               }
//             });

//             if (isExistPhoneNumber) {
//               this.setState({
//                 isConsigning: false,
//                 errorSlotInfo: errorSlotInfo,
//               });
//               return;
//             } else {
//               this.setState({
//                 errorSlotInfo: null,
//               });
//             }
//           } else {
//             this.setState({
//               errorSlotInfo: null,
//             });
//           }

//           const res = await GapService.setAppointment(
//             formData,
//             slotID,
//             formatedTime,
//             formatedDay
//           );
//           if (res && res.objectId) {
//             this.setState(
//               {
//                 bookingDataCode: bookingDataCode,
//                 isHideUserForm: true,
//                 isConsigning: false,
//               },
//               () => {
//                 this.setState({
//                   step: 3,
//                   isHideDayColumn: true,
//                 });
//               }
//             );
//           } else {
//             this.setState(
//               {
//                 isConsigning: false,
//               },
//               () => this.fetchAppointment()
//             );
//             showNotification('Đặt lịch thất bại!');
//           }
//         }
//       );
//     }
//   };

//   // closeModal = () => {
//   //   this.myModal.current.closeModal()
//   // }

//   onHandleStepTwo = () => {
//     this.setState(
//       {
//         isHideUserForm: false,
//       },
//       () => {
//         setTimeout(() => {
//           this.setState({
//             step: 2,
//           });
//         }, 200);
//       }
//     );
//   };

//   backStepOne = () => {
//     this.setState(
//       {
//         isHideUserForm: true,
//       },
//       () => {
//         this.fetchAppointment();
//         setTimeout(() => {
//           this.setState({
//             step: 1,
//           });
//         }, 200);
//       }
//     );
//   };

//   resetAndBackProps = (isOpenInstrucmentPage = false) => {
//     this.setState(
//       {
//         formData: {
//           customerName: '',
//           phoneNumber: '',
//           numberOfProduct: 5,
//         },
//         step: 0,
//         isHideDayColumn: false,
//         choosenDayCode: null,
//         choosenTimeCode: null,
//       },
//       () => {
//         this.fetchAppointment();
//         this.props.backConsignment();

//         isOpenInstrucmentPage === true &&
//           window.open(
//             'https://giveawaypremium.com.vn/kygui?tab=phuongthuc',
//             '_blank'
//           );
//       }
//     );
//   };

//   changeData = e => {
//     if (e.target.value > 50 && e.target.name === 'numberOfProduct') {
//       this.setState({
//         isErrorMax: true,
//       });
//     } else if (e.target.value <= 50 && e.target.name === 'numberOfProduct') {
//       this.setState({
//         isErrorMax: false,
//       });
//     }
//   };

//   render() {
//     const {
//       step,
//       dayBooking,
//       choosenDayCode,
//       timeBooking,
//       bookingDataCode,
//       isErrorMax,
//       errorSlotInfo,
//       choosenTimeCode,
//       formData,
//       isHideUserForm,
//       isConsigning,
//       isHideDayColumn,
//       bookingOptionValue,
//       bookingCustomOptionString,
//     } = this.state;
//     let isShowBookingForm = ReduxServices.getSettingWithKey(
//       'IS_SHOW_BOOKING_FORM',
//       'true'
//     );

//     const layout = {
//       labelCol: { span: 9 },
//       wrapperCol: { span: 15 },
//     };

//     const defaultOptionsSuccess = {
//       loop: false,
//       autoplay: true,
//       animationData: successJson,
//     };

//     const defaultOptionsRightArrow = {
//       loop: true,
//       autoplay: true,
//       animationData: rightArrowJson,
//     };

//     return (
//       <div className="bookingform-home-container">
//         {!isShowBookingForm ? (
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               width: '60%',
//               marginTop: '40px',
//             }}
//           >
//             <p className="text day-txt">
//               Hiện tại tính năng đặt lịch ký gửi trên website đang tạm khoá.
//             </p>
//             <p className="text day-txt">
//               Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm thông
//               tin.
//             </p>
//             <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
//             <Button
//               style={{ maxWidth: '150px' }}
//               className="MT20"
//               onClick={this.resetAndBackProps}
//             >
//               Quay lại
//             </Button>
//           </div>
//         ) : (
//           <div className="bookingform">
//             <div
//               style={{
//                 maxHeight: '80vh',
//                 overflowX: 'hidden',
//                 overflowY: 'scroll',
//               }}
//               className={'dayBooking-box' + (!isHideDayColumn ? ' show' : '')}
//             >
//               {dayBooking.map((dayItem, dayIndex) => {
//                 return (
//                   <div
//                     key={dayIndex}
//                     className={'day-box'}
//                     onClick={() => this.onChooseDay(dayItem)}
//                     style={
//                       choosenDayCode && choosenDayCode === dayItem.dayCode
//                         ? { borderColor: 'black', opacity: 1 }
//                         : choosenDayCode && choosenDayCode !== dayItem.dayCode
//                           ? { opacity: 0.4 }
//                           : {}
//                     }
//                   >
//                     <span className="text day-name">
//                       {dayIndex === 0
//                         ? 'Hôm nay'
//                         : this.translationDate(dayItem.dayName)}
//                     </span>
//                     <span className="text day-txt">{dayItem.date}</span>
//                   </div>
//                 );
//               })}

//               <Lottie
//                 style={{
//                   transform: `rotate(90deg)`,
//                   position: 'absolute',
//                   bottom: 0,
//                   right: '-30px',
//                   zoom: 0.8,
//                 }}
//                 options={defaultOptionsRightArrow}
//                 height={100}
//                 width={100}
//                 speed={1}
//                 isStopped={false}
//                 isPaused={false}
//               />
//             </div>

//             <div className="timeBooking-box">
//               {bookingOptionValue === 7 ? (
//                 <div className="justity-center align-center">
//                   <div
//                     style={{
//                       display: 'flex',
//                       flexDirection: 'column',
//                       width: '90%',
//                       justifyContent: 'center',
//                       alignItems: 'center',
//                     }}
//                   >
//                     <img
//                       width={70}
//                       src={images.logoHeaderWhite}
//                       style={{ objectFit: 'contain' }}
//                     />
//                   </div>
//                   <div
//                     style={{
//                       display: 'flex',
//                       flexDirection: 'column',
//                       width: '85%',
//                       margin: '30px 5% 0 5%',
//                     }}
//                   >
//                     <p className="text day-txt">
//                       Hiện tại tính năng đặt lịch ký gửi trên website đang tạm
//                       khoá.
//                     </p>
//                     <p className="text day-txt">
//                       Quý khách vui lòng gọi hotline 0703 334 443 để biết thêm
//                       thông tin.
//                     </p>
//                     <p className="text day-txt">Xin lỗi vì sự bất tiện này.</p>
//                     <div
//                       style={{
//                         display: 'flex',
//                         flexDirection: 'column',
//                         width: '100%',
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                       }}
//                     >
//                       <Button
//                         style={{ maxWidth: '150px' }}
//                         className="MT20"
//                         onClick={this.resetAndBackProps}
//                       >
//                         Quay lại
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <div
//                     style={
//                       bookingOptionValue === 9
//                         ? { gridTemplateColumns: 'auto auto auto' }
//                         : { gridTemplateColumns: 'auto auto' }
//                     }
//                     className={
//                       'timeBooking-grid' +
//                       (step === 1 && isHideUserForm ? ' show' : '')
//                     }
//                   >
//                     {timeBooking.map((itemTime, indexTime) => {
//                       const isReady =
//                         !bookingDataCode.includes(
//                           choosenTimeCode + choosenDayCode
//                         ) && itemTime.timeCode === choosenTimeCode;
//                       const isBusy = bookingDataCode.includes(
//                         itemTime.timeCode + choosenDayCode
//                       );

//                       const isShow =
//                         bookingCustomOptionString === 'default'
//                           ? true
//                           : bookingCustomOptionString.includes(
//                               itemTime.timeCode
//                             );
//                       if (!isShow) {
//                         return null;
//                       }
//                       return (
//                         <div
//                           style={
//                             isBusy
//                               ? { pointerEvents: 'none', cursor: 'none' }
//                               : {}
//                           }
//                           onClick={() =>
//                             isBusy ? {} : this.onChooseTime(itemTime)
//                           }
//                           key={indexTime}
//                           className={
//                             'time-box' +
//                             (isReady ? ' ready' : isBusy ? ' busy' : '')
//                           }
//                         >
//                           <span className="text">{itemTime.timeName}</span>
//                         </div>
//                       );
//                     })}
//                   </div>

//                   <div
//                     className={
//                       'explain-box' +
//                       (step === 1 && isHideUserForm ? ' show' : '')
//                     }
//                   >
//                     <div className="explain-box-left">
//                       <div className="box-full" />
//                       <span className="box-text">Đã Đặt Chỗ</span>
//                     </div>
//                     <div className="explain-box-right">
//                       <div className="box-empty" />
//                       <span className="box-text">Còn Trống</span>
//                     </div>
//                   </div>

//                   <div
//                     className={
//                       'timeBooking-footer' +
//                       ((step === 1 || step === 0) && isHideUserForm
//                         ? ' show'
//                         : '')
//                     }
//                   >
//                     <span
//                       onClick={() => this.resetAndBackProps(false)}
//                       className="text"
//                     >{`< Quay lại`}</span>
//                     {step === 1 && (
//                       <span
//                         onClick={this.onHandleStepTwo}
//                         className="text"
//                         style={
//                           choosenTimeCode
//                             ? { color: 'black' }
//                             : { opacity: 0.5, pointerEvents: 'none' }
//                         }
//                       >{`Tiếp tục >`}</span>
//                     )}
//                   </div>
//                 </>
//               )}

//               <Form
//                 className={
//                   'timeBooking-form' +
//                   (!isHideUserForm && step === 2 ? ' show' : '')
//                 }
//                 ref={this.formRef}
//                 {...layout}
//                 name="consignment"
//                 initialValues={formData}
//                 // onFinish={this.onFinish}
//                 onFinish={this.onConsign}
//                 onValuesChange={(changedValues, allValues) => {
//                   this.setState(
//                     {
//                       formData: {
//                         ...formData,
//                         ...changedValues,
//                       },
//                     },
//                     () => console.log(this.state)
//                   );
//                 }}
//               >
//                 <Row className="flex sell-card-form" justify="center">
//                   <Form.Item name="dayTime" label="Thời gian">
//                     <Col sm={24} md={22}>
//                       <Input
//                         size="small"
//                         value={this.convertCodeToTime()}
//                         placeholder="..."
//                       />
//                     </Col>
//                   </Form.Item>
//                   <Form.Item
//                     name="customerName"
//                     rules={[
//                       {
//                         required: true,
//                         message: 'Vui lòng nhập tên quý khách',
//                       },
//                     ]}
//                     label="Họ và Tên"
//                   >
//                     <Col sm={24} md={22}>
//                       <Input
//                         value={formData.customerName}
//                         size="small"
//                         allowClear
//                         id="customerName"
//                         key="customerName"
//                         onChange={this.changeData}
//                         placeholder="..."
//                       />
//                     </Col>
//                   </Form.Item>

//                   <Form.Item
//                     name="phoneNumber"
//                     rules={[
//                       {
//                         required: true,
//                         message: 'Vui lòng nhập số điện thoại',
//                       },
//                     ]}
//                     label="Số điện thoại"
//                   >
//                     <Col sm={24} md={22}>
//                       <Input
//                         value={formData.phoneNumber}
//                         size="small"
//                         type={'number'}
//                         id="phoneNumber"
//                         key="phoneNumber"
//                         onChange={this.changeData}
//                         allowClear
//                         placeholder="..."
//                       />
//                     </Col>
//                   </Form.Item>

//                   <Form.Item
//                     name="numberOfProduct"
//                     rules={[
//                       {
//                         required: true,
//                         message: 'Vui lòng nhập số lượng hàng',
//                       },
//                     ]}
//                     label="Số lượng Hàng Hoá"
//                     {...(formData.numberOfProduct < 5
//                       ? {
//                           validateStatus: 'error',
//                           help: 'Số lượng ký gửi tối thiểu là 5 món. Tuy nhiên, nếu anh/chị ký gửi sản phẩm luxury (giá trị ký gửi trên 5.000.000đ). Vui lòng liên hệ hotline 0703334443 để được hỗ trợ tốt nhất.',
//                         }
//                       : {})}
//                     {...(isErrorMax
//                       ? {
//                           validateStatus: 'error',
//                           help: 'Với số lượng hàng hoá trên 50, Xin vui lòng liên hệ hotline 0703334443 để được hỗ trợ tốt nhất.',
//                         }
//                       : {})}
//                   >
//                     <Col sm={24} md={6}>
//                       <Input
//                         value={formData.numberOfProduct}
//                         size="small"
//                         defaultValue={1}
//                         name="numberOfProduct"
//                         type={'number'}
//                         id="numberOfProduct"
//                         key="numberOfProduct"
//                         onChange={this.changeData}
//                         placeholder="..."
//                       />
//                     </Col>
//                   </Form.Item>

//                   <div className="bookingNoteString">
//                     <span>
//                       *Chúng tôi sẽ giữ lịch tối đa 15 phút nếu đến trễ Anh/Chị
//                       vui lòng đợi theo số thứ tự tại cửa hàng
//                     </span>
//                   </div>

//                   {errorSlotInfo ? (
//                     <div className="bookingErrorSlot">
//                       <span>
//                         Khách hàng {errorSlotInfo.customerName} đã đặt lịch cho
//                         khung thời gian {errorSlotInfo.dateTime} ngày{' '}
//                         {errorSlotInfo.date}. Vui lòng đặt lịch lại cho vào ngày
//                         khác hoặc liên hệ hotline 0703334443 để được thay đổi
//                         lịch hẹn cùng ngày.
//                       </span>
//                     </div>
//                   ) : null}

//                   <div
//                     className="flex justify-around align-center"
//                     style={{ width: '100%' }}
//                   >
//                     <Button onClick={this.backStepOne} type="secondary">
//                       Quay lại
//                     </Button>
//                     <Button
//                       disabled={
//                         isErrorMax ||
//                         formData.numberOfProduct < 5 ||
//                         formData.numberOfProduct > 100
//                       }
//                       loading={isConsigning}
//                       type="secondary"
//                       htmlType="submit"
//                     >
//                       Xác nhận
//                     </Button>
//                   </div>
//                 </Row>
//               </Form>

//               <div
//                 className={
//                   'timeBooking-confirm' +
//                   (isHideUserForm && step === 3 ? ' show' : '')
//                 }
//               >
//                 <Lottie
//                   options={defaultOptionsSuccess}
//                   delay={2000}
//                   height={150}
//                   width={150}
//                   isStopped={false}
//                   isPaused={false}
//                 />
//                 <Row justify="center">
//                   <Col span={20}>
//                     <Descriptions>
//                       <Descriptions.Item span={24} label="Thời gian ký gửi">
//                         {this.convertCodeToTime()}
//                       </Descriptions.Item>
//                       <Descriptions.Item span={24} label="Tên Khách Hàng">
//                         {formData.customerName}
//                       </Descriptions.Item>
//                       <Descriptions.Item span={24} label="Số điện thoại">
//                         {formData.phoneNumber}
//                       </Descriptions.Item>
//                       <Descriptions.Item span={24} label="Số lượng hàng hoá">
//                         {formData.numberOfProduct}
//                       </Descriptions.Item>
//                     </Descriptions>
//                   </Col>
//                 </Row>
//                 <Button
//                   className="MT20"
//                   onClick={() => this.resetAndBackProps(true)}
//                 >
//                   Quay lại
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}
//         <MyModal ref={this.myModal} />
//       </div>
//     );
//   }
// }

// const mapStateToProps = state => ({
//   locale: state.locale,
//   settingRedux: state.settingRedux,
//   userData: state.userData,
// });

// export default withRouter(connect(mapStateToProps)(ConsignmentScreen));
