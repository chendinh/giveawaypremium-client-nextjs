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

export const TIME_BOOKING: TimeBookingOptions = {
  OPTION_1: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '11:00', timeCode: '1100' },
  ],
  OPTION_2: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '11:00', timeCode: '1100' },
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '15:00', timeCode: '1500' },
  ],
  OPTION_3: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '11:00', timeCode: '1100' },
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '15:00', timeCode: '1500' },
    { timeName: '16:00', timeCode: '1600' },
    { timeName: '17:00', timeCode: '1700' },
  ],
  OPTION_4: [
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '15:00', timeCode: '1500' },
    { timeName: '16:00', timeCode: '1600' },
    { timeName: '17:00', timeCode: '1700' },
  ],
  OPTION_5: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '15:00', timeCode: '1500' },
    { timeName: '16:00', timeCode: '1600' },
  ],
  OPTION_6: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '11:00', timeCode: '1100' },
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '15:00', timeCode: '1500' },
    { timeName: '16:00', timeCode: '1600' },
    { timeName: '17:00', timeCode: '1700' },
    { timeName: '18:00', timeCode: '1800' },
    { timeName: '19:00', timeCode: '1900' },
  ],
  OPTION_7: [], // Closed - no slots
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
  OPTION_9: [
    { timeName: '10:00', timeCode: '1000' },
    { timeName: '10:30', timeCode: '1030' },
    { timeName: '11:00', timeCode: '1100' },
    { timeName: '13:30', timeCode: '1330' },
    { timeName: '14:00', timeCode: '1400' },
    { timeName: '14:30', timeCode: '1430' },
    { timeName: '15:00', timeCode: '1500' },
    { timeName: '15:30', timeCode: '1530' },
    { timeName: '16:00', timeCode: '1600' },
    { timeName: '16:30', timeCode: '1630' },
    { timeName: '17:00', timeCode: '1700' },
    { timeName: '17:30', timeCode: '1730' },
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
