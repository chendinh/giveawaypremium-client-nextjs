# GiveAwayPremium — Project Overview

## Business Domain

Nền tảng thương mại điện tử hàng cao cấp (luxury e-commerce) chuyên:

- **Ký gửi (Consignment):** Khách hàng ký gửi hàng hiệu để bán lại
- **Campaign:** Chiến dịch giveaway/flash sale sản phẩm
- **Order:** Quản lý đơn hàng, tích hợp vận chuyển
- **Appointment:** Đặt lịch hẹn tư vấn/nhận hàng

## Monorepo Structure

```
Desktop/
├── giveawaypremium-server-nestjs/   # Backend
└── giveawaypremium-client-nextjs/   # Frontend (THIS REPO)
```

## Tech Stack — Frontend

| Layer         | Tech                                   |
| ------------- | -------------------------------------- |
| Framework     | Next.js 16 (App Router)                |
| Styling       | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| State         | Zustand v5                             |
| Server state  | TanStack Query v4                      |
| Forms         | React Hook Form + Zod v4               |
| HTTP          | Axios (custom `createAxiosInstance`)   |
| i18n          | i18next + next-i18next (vi/en)         |
| Charts        | Chart.js + react-chartjs-2             |
| Flow diagrams | @xyflow/react (XYFlow)                 |
| UI components | antd v6 (admin), Radix UI (public)     |

## Tech Stack — Backend

| Layer         | Tech                                  |
| ------------- | ------------------------------------- |
| Framework     | NestJS v10                            |
| Database/Auth | Parse Server v7 + Parse Dashboard     |
| Scheduler     | @nestjs/schedule (cron)               |
| Media         | Cloudinary                            |
| Email         | Nodemailer + Sendinblue (sib-api)     |
| Shipping      | GHTK (GiaoHangTietKiem) + ViettelPost |
| Product sync  | Nhanh.vn API                          |

## Environment Variables

**Client (`.env.local`):**

- `NEXT_PUBLIC_API_URL` — Parse Server REST API base URL
- `NEXT_PUBLIC_PARSE_APP_ID` — Parse application ID
- `NEXT_PUBLIC_PARSE_JS_KEY` — Parse JS key

**Server (`.env`):**

- `PARSE_SERVER_DATABASE_URI` — MongoDB URI
- `PARSE_SERVER_APP_ID`, `PARSE_SERVER_MASTER_KEY`
- `CLOUDINARY_*`, `EMAIL_*`, `GHTK_TOKEN`, `VIETTELPOST_TOKEN`
- `NHANH_API_KEY`, `NHANH_BUSINESS_ID`

## Key Product Categories (hardcoded IDs)

```ts
FASHION: '0paqD5jvw3'; // Thời trang
MACHINE: 'B3OQuAChW1'; // Thiết bị làm đẹp
PERFUME: 'YIUniNrIKb'; // Nước hoa
SHOES: 'PtUHtoonRc'; // Giày
BAG: 'dNYERCGnBT'; // Túi & ví
COMESTIC: 'OwyMj5kQ2N'; // Mỹ phẩm
ACCESSORIES: 'eMxuZ7VdUy'; // Dụng cụ trang điểm
```

## API Pattern

All API calls go through Parse Server REST at `NEXT_PUBLIC_API_URL`.
Use `createAxiosInstance()` from `src/lib/axiosBase.ts`.
Auth: Bearer token stored in `localStorage['access_token']`.

Parse REST endpoints follow: `/classes/{ClassName}` (see `API_ENDPOINTS` in `src/lib/constants.ts`)
