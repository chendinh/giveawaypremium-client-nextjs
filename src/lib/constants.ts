// Booking Time Options
export interface TimeBookingItem {
  timeName: string;
  timeCode: string;
}

export interface TimeBookingOptions {
  OPTION_1: TimeBookingItem[];
  OPTION_2: TimeBookingItem[];
  OPTION_3: TimeBookingItem[];
  OPTION_4: TimeBookingItem[];
  OPTION_5: TimeBookingItem[];
  OPTION_6: TimeBookingItem[];
  OPTION_7: TimeBookingItem[];
  OPTION_8: TimeBookingItem[];
  OPTION_9: TimeBookingItem[];
  [key: string]: TimeBookingItem[];
}

export const TIME_BOOKING = {
  OPTION_1: [
    {
      timeName: '9:30',
      timeCode: '0930',
    },
    {
      timeName: '10:00',
      timeCode: '1000',
    },
    {
      timeName: '10:30',
      timeCode: '1030',
    },
    {
      timeName: '11:00',
      timeCode: '1100',
    },
    {
      timeName: '11:30',
      timeCode: '1130',
    },
    {
      timeName: '13:00',
      timeCode: '1300',
    },
    {
      timeName: '13:30',
      timeCode: '1330',
    },
    {
      timeName: '14:00',
      timeCode: '1400',
    },
    {
      timeName: '14:30',
      timeCode: '1430',
    },
    {
      timeName: '15:00',
      timeCode: '1500',
    },
    {
      timeName: '15:30',
      timeCode: '1530',
    },
    {
      timeName: '16:00',
      timeCode: '1600',
    },
    {
      timeName: '16:30',
      timeCode: '1630',
    },
    {
      timeName: '17:00',
      timeCode: '1700',
    },
    {
      timeName: '17:30',
      timeCode: '1730',
    },
    {
      timeName: '18:00',
      timeCode: '1800',
    },
    {
      timeName: '18:30',
      timeCode: '1830',
    },
    {
      timeName: '19:00',
      timeCode: '1900',
    },
    {
      timeName: '19:30',
      timeCode: '1930',
    },
    {
      timeName: '20:00',
      timeCode: '2000',
    },
    {
      timeName: '20:30',
      timeCode: '2030',
    },
    {
      timeName: '21:00',
      timeCode: '2100',
    },
  ],
  OPTION_2: [
    {
      timeName: '10:00',
      timeCode: '1000',
    },
    {
      timeName: '11:00',
      timeCode: '1100',
    },
    {
      timeName: '13:00',
      timeCode: '1300',
    },
    {
      timeName: '14:00',
      timeCode: '1400',
    },
    {
      timeName: '15:00',
      timeCode: '1500',
    },
    {
      timeName: '16:00',
      timeCode: '1600',
    },
    {
      timeName: '17:00',
      timeCode: '1700',
    },
    {
      timeName: '18:00',
      timeCode: '1800',
    },
  ],
  OPTION_3: [
    {
      timeName: '10:00',
      timeCode: '1000',
    },
    {
      timeName: '10:30',
      timeCode: '1030',
    },
    {
      timeName: '11:00',
      timeCode: '1100',
    },
    {
      timeName: '11:30',
      timeCode: '1130',
    },
    {
      timeName: '13:00',
      timeCode: '1300',
    },
    {
      timeName: '13:30',
      timeCode: '1330',
    },
    {
      timeName: '14:00',
      timeCode: '1400',
    },
    {
      timeName: '14:30',
      timeCode: '1430',
    },
    {
      timeName: '15:00',
      timeCode: '1500',
    },
  ],
  OPTION_4: [
    {
      timeName: '10:00',
      timeCode: '1000',
    },
    {
      timeName: '11:00',
      timeCode: '1100',
    },
    {
      timeName: '13:00',
      timeCode: '1300',
    },
    {
      timeName: '14:00',
      timeCode: '1400',
    },
    {
      timeName: '15:00',
      timeCode: '1500',
    },
  ],
  OPTION_5: [
    {
      timeName: '15:00',
      timeCode: '1500',
    },
    {
      timeName: '15:30',
      timeCode: '1530',
    },
    {
      timeName: '16:00',
      timeCode: '1600',
    },
    {
      timeName: '16:30',
      timeCode: '1630',
    },
    {
      timeName: '17:00',
      timeCode: '1700',
    },
    {
      timeName: '17:30',
      timeCode: '1730',
    },
    {
      timeName: '18:00',
      timeCode: '1800',
    },
    {
      timeName: '18:30',
      timeCode: '1830',
    },
    {
      timeName: '19:00',
      timeCode: '1900',
    },
    {
      timeName: '19:30',
      timeCode: '1930',
    },
  ],
  OPTION_6: [
    {
      timeName: '15:00',
      timeCode: '1500',
    },
    {
      timeName: '16:00',
      timeCode: '1600',
    },
    {
      timeName: '17:00',
      timeCode: '1700',
    },
    {
      timeName: '18:00',
      timeCode: '1800',
    },
    {
      timeName: '19:00',
      timeCode: '1900',
    },
  ],
  OPTION_7: [],
  OPTION_8: [
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
  OPTION_9: [
    {
      timeName: '10:00',
      timeCode: '1000',
    },
    {
      timeName: '10:15',
      timeCode: '1015',
    },
    {
      timeName: '10:30',
      timeCode: '1030',
    },
    {
      timeName: '10:45',
      timeCode: '1045',
    },
    {
      timeName: '11:00',
      timeCode: '1100',
    },
    {
      timeName: '11:15',
      timeCode: '1115',
    },
    {
      timeName: '11:30',
      timeCode: '1130',
    },
    {
      timeName: '11:45',
      timeCode: '1145',
    },
    {
      timeName: '13:00',
      timeCode: '1300',
    },
    {
      timeName: '13:15',
      timeCode: '1315',
    },
    {
      timeName: '13:30',
      timeCode: '1330',
    },
    {
      timeName: '13:45',
      timeCode: '1345',
    },
    {
      timeName: '14:00',
      timeCode: '1400',
    },
    {
      timeName: '14:15',
      timeCode: '1415',
    },
    {
      timeName: '14:30',
      timeCode: '1430',
    },
    {
      timeName: '14:45',
      timeCode: '1445',
    },
    {
      timeName: '15:00',
      timeCode: '1500',
    },
    {
      timeName: '15:15',
      timeCode: '1515',
    },
    {
      timeName: '15:30',
      timeCode: '1530',
    },
    {
      timeName: '15:45',
      timeCode: '1545',
    },
    {
      timeName: '16:00',
      timeCode: '1600',
    },
    {
      timeName: '16:15',
      timeCode: '1615',
    },
    {
      timeName: '16:30',
      timeCode: '1630',
    },
    {
      timeName: '16:45',
      timeCode: '1645',
    },
    {
      timeName: '17:00',
      timeCode: '1700',
    },
    {
      timeName: '17:15',
      timeCode: '1715',
    },
    {
      timeName: '17:30',
      timeCode: '1730',
    },
    {
      timeName: '17:45',
      timeCode: '1745',
    },
    {
      timeName: '18:00',
      timeCode: '1800',
    },
    {
      timeName: '18:30',
      timeCode: '1830',
    },
  ],
};

export interface BookingOptionEachDayType {
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

export const BOOKING_OPTION_EACH_DAY_DATA_DEFAULT: BookingOptionEachDayType = {
  OPTION_1: '',
  OPTION_2: '',
  OPTION_3: '',
  OPTION_4: '',
  OPTION_5: '',
  OPTION_6: '',
  OPTION_7: '',
  OPTION_8: '',
  OPTION_9: '',
};

// Other constants
export const API_ENDPOINTS = {
  APPOINTMENT: '/classes/AppointmentSchedule',
  PRODUCT: '/classes/Product',
  CATEGORY: '/classes/Category',
  SETTING: '/classes/Setting',
  CONSIGNMENT_GROUP: '/classes/ConsignmentGroup',
  ORDER_REQUEST: '/classes/OrderRequest',
  MEDIA: '/classes/Media',
} as const;

export const KEY_STORE = {
  SET_LOCALE: 'SET_LOCALE',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_SETTING: 'SET_SETTING',
  SET_TRANSFER_DATA: 'SET_TRANSFER_DATA',
  SET_CATEGORY: 'SET_CATEGORY',
  SET_IP_HASH: 'SET_IP_HASH',
  SET_CHANNEL_MONITOR: 'SET_CHANNEL_MONITOR',
  SET_TEMP_CONSIGNMENT: 'SET_TEMP_CONSIGNMENT',
  SET_ADDRESS_INFO_ARRAY: 'SET_ADDRESS_INFO_ARRAY',
  SET_ADDRESS_INFO_ARRAY_AFFTER_SORT: 'SET_ADDRESS_INFO_ARRAY_AFFTER_SORT',
};

export const OBJECTID_CATEGORY = {
  FASHION: '0paqD5jvw3', // thoi trang
  MACHINE: 'B3OQuAChW1', // thiet bi lam dep
  PERFUME: 'YIUniNrIKb', // nuoc hoa
  SHOES: 'PtUHtoonRc', // giay
  BAG: 'dNYERCGnBT', // tui & vi
  COMESTIC: 'OwyMj5kQ2N', // my pham
  ACCESSORIES: 'eMxuZ7VdUy', // dung cu trang diem
};

export const OBJECTID_SUB_CATEGORY = {
  // giay
  GIAY_BET: 'GBDAbyB7fx',
  GIAY_CAO_GOT: 'UWobIyULJA',
  GIAY_THE_THAO: '4FVRp20cE2',
  // thoi trang
  DAM: 'LjGfBcm0iz',
  AO_KHOAC: 'vGY4HOBbTG',
  SUIT: 'qqsjuoE4HM',
  VAY: 'EG2GjmOKvj',
  QUAN: 'AXLJIdkEhI',
  AO: 'Lz9H9NGGaE',
  //
};

export const REQUEST_TYPE = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const EMAIL_TYPE = {
  CONSIGNMENT: 'CONSIGNMENT',
  PAYMENT: 'PAYMENT',
};

export const EMAIL_TITLE = {
  CONSIGNMENT: 'Xác Nhận Thông Tin Ký Gửi',
  PAYMENT: 'Xác Nhận Thông Tin Chuyển Khoản',
};

export const BOOKING_OPTION_EACH_DAY = 'BOOKING_OPTION_EACH_DAY';
export const BOOKING_OPTION_CUSTOM_EACH_DAY = 'BOOKING_OPTION_CUSTOM_EACH_DAY';

export const WORKING_DAY_COUNT = 'WORKING_DAY_COUNT';

export const DEFAULT_BOOKING_OPTION_VALUE = 8;
