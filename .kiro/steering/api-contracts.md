# API Contracts

## Parse Server REST — Base Pattern

```
Base URL: process.env.NEXT_PUBLIC_API_URL
Auth header: X-Parse-Application-Id + X-Parse-Session-Token (or Bearer)
```

### CRUD via REST

```
GET    /classes/{ClassName}           # find (supports where, limit, skip, include)
POST   /classes/{ClassName}           # create
GET    /classes/{ClassName}/{id}      # get one
PUT    /classes/{ClassName}/{id}      # update
DELETE /classes/{ClassName}/{id}      # hard delete (avoid — use soft delete)
```

### Parse Classes Map

| Class                 | Description      | Key Fields                                                                                                                                                                   |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Product`             | Sản phẩm ký gửi  | `name`, `price`, `priceAfterFee`, `count`, `remainNumberProduct`, `soldNumberProduct`, `category`, `subCategory`, `consignment`, `consigner`, `consignee`, `rateNew`, `code` |
| `Consignment`         | Đơn ký gửi       | `consigner` (User), `consignee` (User), `group`, `productList[]`, `deletedAt`                                                                                                |
| `ConsignmentGroup`    | Nhóm ký gửi      | `name`, `consigner`                                                                                                                                                          |
| `Order`               | Đơn hàng         | `productList[]`, `transporter`, `orderRequest`, `deletedAt`                                                                                                                  |
| `OrderRequest`        | Yêu cầu đặt hàng | `status` (OrderRequestStatus), `productList[]`                                                                                                                               |
| `Campaign`            | Chiến dịch       | `status` (PENDING\|ACTIVE), `startDate`, `endDate`                                                                                                                           |
| `Category`            | Danh mục         | `name`, hardcoded IDs in `OBJECTID_CATEGORY`                                                                                                                                 |
| `SubCategory`         | Danh mục con     | `name`, `category`, hardcoded IDs in `OBJECTID_SUB_CATEGORY`                                                                                                                 |
| `Transporter`         | Vận chuyển       | `service` ('giaohangtietkiem'\|'viettelpost'), `res`, `status`, `order`                                                                                                      |
| `AppointmentSchedule` | Lịch hẹn         | `date`, `timeCode`, `option`                                                                                                                                                 |
| `Media`               | File/image       | `url`, `cloudinaryId`                                                                                                                                                        |
| `ExternalConfig`      | Cấu hình ngoài   | key-value config store                                                                                                                                                       |

### OrderRequestStatus Enum

```ts
// src/constants/order-status.ts (server)
PENDING → IN_ORDER → COMPLETED | CANCELLED
```

---

## Parse Cloud Functions (callable from client)

Call via: `Parse.Cloud.run('functionName', params)` or `POST /functions/{name}`

### Administrative Units

```ts
// Vietnamese address hierarchy
Parse.Cloud.run('getProvinces'); // → Province[]
Parse.Cloud.run('getDistricts', { provinceId }); // → District[]
Parse.Cloud.run('getWards', { districtId }); // → Ward[]
```

### Email

```ts
Parse.Cloud.run('sendConsignmentEmail', {
  consignmentId: string,
  // Sends consignment.ejs template to consigner
});
Parse.Cloud.run('sendPaymentEmail', {
  orderId: string,
  // Sends payment.ejs template
});
```

### Product

```ts
Parse.Cloud.run('getProductsByCategory', {
  categoryId: string,
  limit?: number,
  skip?: number,
})
Parse.Cloud.run('searchProducts', {
  query: string,
  categoryId?: string,
})
```

### Shipping (Transporter)

```ts
Parse.Cloud.run('createGHTKOrder', {
  orderId: string,
  // Creates GHTK shipment, returns tracking number
});
Parse.Cloud.run('getShippingFee', {
  service: 'giaohangtietkiem' | 'viettelpost',
  weight: number,
  districtId: string,
});
```

### Guest Order

```ts
Parse.Cloud.run('createGuestOrder', {
  productList: Array<{ objectId: string; count: number; price: number }>,
  customerInfo: { name: string, phone: string, address: string },
  // No auth required
});
```

---

## NestJS REST Endpoints

### Media Upload

```
POST /media/upload
Content-Type: multipart/form-data
Body: file (image)
Response: { url: string, publicId: string }
```

### Nhanh Webhook

```
POST /hooks/nhanh
Body: Nhanh.vn webhook payload
// Triggers product/inventory sync
```

---

## API_ENDPOINTS Constants (client)

```ts
// src/lib/constants.ts
API_ENDPOINTS.APPOINTMENT = '/classes/AppointmentSchedule';
API_ENDPOINTS.PRODUCT = '/classes/Product';
API_ENDPOINTS.CATEGORY = '/classes/Category';
API_ENDPOINTS.SETTING = '/classes/Setting';
API_ENDPOINTS.CONSIGNMENT_GROUP = '/classes/ConsignmentGroup';
API_ENDPOINTS.ORDER_REQUEST = '/classes/OrderRequest';
API_ENDPOINTS.MEDIA = '/classes/Media';
```

---

## Query Patterns (Parse REST)

### Filter + Include

```
GET /classes/Product?where={"category":{"__type":"Pointer","className":"Category","objectId":"0paqD5jvw3"}}&include=category,subCategory&limit=20
```

### Soft-deleted items (exclude)

```
GET /classes/Product?where={"deletedAt":{"$exists":false}}
```

### Sort by date

```
GET /classes/Consignment?order=-createdAt&limit=10
```
