# Viettel Post Integration Guide

## Tổng quan

Tích hợp Viettel Post đã được triển khai trong Next.js với kiến trúc xử lý trực tiếp qua Next.js API Routes, không cần qua Parse Server như GHTK.

## Authentication Flow

Viettel Post sử dụng luồng xác thực 2 bước:

### Bước 1: Login - Lấy temporary token
```
POST /v2/user/Login
Body: { USERNAME, PASSWORD }
Response: { data: { token: "temporary_token" } }
```

### Bước 2: OwnerConnect - Đổi temporary token thành long-term token
```
POST /v2/user/ownerconnect
Headers: { Token: "temporary_token" }
Body: { USERNAME, PASSWORD }
Response: { data: { token: "long_term_token" } }
```

### Bước 3: Sử dụng long-term token cho các API call
```
Headers: { Token: "long_term_token" }
```

**Lưu ý quan trọng**:
- Phải thực hiện cả 2 bước mới có token hợp lệ
- Token có hiệu lực 24 giờ
- ViettelPostService tự động xử lý luồng này và cache token

## Kiến trúc

```
Frontend (React Components)
    ↓
GapServices (Client API Layer)
    ↓
Next.js API Routes (/api/shipping/viettel-post/*)
    ↓
ViettelPostService (Server-side Service)
    ↓ (Two-step authentication)
    │  1. POST /user/Login → temp token
    │  2. POST /user/ownerconnect → long-term token
    ↓
Viettel Post API
```

## Cấu trúc thư mục

```
src/
├── services/shipping/
│   ├── types.ts                           # Shared shipping types
│   └── viettel-post/
│       ├── types.ts                       # Viettel Post specific types
│       └── ViettelPostService.ts          # Viettel Post API service
│
├── app/api/shipping/viettel-post/
│   ├── estimate-fee/route.ts             # Tính phí vận chuyển
│   ├── create-order/route.ts             # Tạo đơn vận chuyển
│   ├── cancel-order/route.ts             # Hủy đơn
│   ├── get-label/route.ts                # Lấy tem vận chuyển
│   └── tracking/route.ts                 # Tra cứu đơn hàng
│
└── app/admin/components/ManageScreen/components/TableOrder/components/
    └── BillOrderViettelPost/index.tsx    # Component hiển thị nhãn Viettel Post
```

## Environment Variables

Cần thêm các biến môi trường sau vào file `.env.local`:

```env
# Viettel Post Configuration
VIETTEL_POST_API_URL=https://partner.viettelpost.vn/v2
VIETTEL_POST_USERNAME=your_username_here
VIETTEL_POST_PASSWORD=your_password_here
```

## API Methods đã được thêm vào GapServices

### 1. Tính phí vận chuyển

```typescript
GapService.getViettelPostFee(
  formData: {
    orderAdressProvince?: string;
    orderAdressDistrict?: string;
    orderAdressWard?: string;
  },
  weight: number = 0.2,
  value: number = 0,
  moneyCollection: number = 0
): Promise<any>
```

**Ví dụ sử dụng:**
```typescript
const feeResponse = await GapService.getViettelPostFee(
  {
    orderAdressProvince: 'Hà Nội',
    orderAdressDistrict: 'Hoàn Kiếm',
    orderAdressWard: 'Hàng Bạc'
  },
  0.5, // 0.5kg
  100000, // 100,000 VND
  0 // No COD
);

if (feeResponse.success) {
  console.log('Shipping fee:', feeResponse.fee);
}
```

### 2. Tạo đơn vận chuyển

```typescript
GapService.pushOrderToViettelPost(
  orderData: any,
  orderId: string
): Promise<any>
```

**Ví dụ sử dụng:**
```typescript
const result = await GapService.pushOrderToViettelPost(orderItem, orderItem.objectId);

if (result.success) {
  toast.success('Tạo đơn Viettel Post thành công');
  // result.orderNumber - Mã đơn hàng
  // result.totalFee - Phí vận chuyển
} else {
  toast.error(result.error || 'Tạo đơn thất bại');
}
```

### 3. Hủy đơn vận chuyển

```typescript
GapService.cancelViettelPostOrder(orderNumber: string): Promise<any>
```

**Ví dụ sử dụng:**
```typescript
const result = await GapService.cancelViettelPostOrder(orderNumber);

if (result.success) {
  toast.success('Hủy đơn thành công');
} else {
  toast.error(result.error || 'Hủy đơn thất bại');
}
```

### 4. Lấy nhãn vận chuyển

```typescript
GapService.getViettelPostLabel(orderNumber: string): Promise<any>
```

**Ví dụ sử dụng:**
```typescript
const result = await GapService.getViettelPostLabel(orderNumber);

if (result.success && result.pdfBase64) {
  // Display PDF label
  const pdfUrl = `data:application/pdf;base64,${result.pdfBase64}`;
}
```

### 5. Tra cứu đơn hàng

```typescript
GapService.getViettelPostTracking(orderNumber: string): Promise<any>
```

**Ví dụ sử dụng:**
```typescript
const result = await GapService.getViettelPostTracking(orderNumber);

if (result.success && result.orders.length > 0) {
  const order = result.orders[0];
  console.log('Status:', order.ORDER_STATUS_NAME);
  console.log('Customer:', order.RECEIVER_FULLNAME);
}
```

## Tích hợp vào TableOrder Component

### Bước 1: Import BillOrderViettelPost component

```typescript
import BillOrderViettelPost from './components/BillOrderViettelPost/index';
```

### Bước 2: Thêm state cho Viettel Post modal

```typescript
// Viettel Post detail modal
const [viettelPostDetailOpen, setViettelPostDetailOpen] = useState<boolean>(false);
const [viettelPostDetailItem, setViettelPostDetailItem] = useState<OrderItem | null>(null);
```

### Bước 3: Thêm handlers

```typescript
// ── Viettel Post: push order ──
const handlePushOrderToViettelPost = async (row: OrderItem) => {
  if (row && !row.isGetMoney) {
    toast.error('Vui lòng xác nhận Nhận Tiền trước');
    return;
  }
  try {
    const res = await GapService.pushOrderToViettelPost(row as any, row.objectId);
    if (res) {
      if (res.error) {
        toast.error(res.error || 'Cập nhật Viettel Post chưa được');
        return;
      }
      toast.success('Tạo đơn Viettel Post thành công');
      handleRefresh();
    } else {
      toast.error('Cập nhật Viettel Post chưa được');
    }
  } catch (err) {
    console.error(err);
    toast.error('Có lỗi xảy ra');
  }
};

// ── Viettel Post: view detail ──
const openViettelPostDetail = (item: OrderItem) => {
  // Check if item has Viettel Post transporter data
  // Note: You may need to modify Order schema to store Viettel Post info separately
  setViettelPostDetailItem(item);
  setViettelPostDetailOpen(true);
};

// ── Viettel Post: cancel order ──
const handleCancelViettelPostOrder = async (orderNumber: string) => {
  try {
    const res = await GapService.cancelViettelPostOrder(orderNumber);
    if (res?.success) {
      toast.success('Hủy đơn thành công');
      setViettelPostDetailOpen(false);
      handleRefresh();
    } else {
      toast.error('Hủy đơn không thành công');
    }
  } catch (err) {
    console.error(err);
    toast.error('Có lỗi xảy ra');
  }
};
```

### Bước 4: Thêm button trong bảng orders

```typescript
// In the table column, add a button for Viettel Post similar to GHTK
<Button
  variant="outline"
  size="sm"
  onClick={() => handlePushOrderToViettelPost(row)}
>
  <Truck className="h-4 w-4 mr-1" />
  Tạo đơn Viettel Post
</Button>
```

### Bước 5: Thêm modal hiển thị thông tin Viettel Post

```tsx
{/* Viettel Post Detail Dialog */}
<Dialog open={viettelPostDetailOpen} onOpenChange={setViettelPostDetailOpen}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Chi tiết đơn Viettel Post</DialogTitle>
    </DialogHeader>

    {viettelPostDetailItem && (
      <div className="space-y-4">
        <BillOrderViettelPost
          orderNumber={viettelPostDetailItem.objectId}
        />

        <div className="flex gap-2 justify-end">
          <Button
            variant="destructive"
            onClick={() => handleCancelViettelPostOrder(viettelPostDetailItem.objectId)}
          >
            Hủy Đơn Hàng
          </Button>
          <Button
            variant="outline"
            onClick={() => setViettelPostDetailOpen(false)}
          >
            Đóng
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

## Tích hợp vào SaleScreen Component

### Bước 1: Thêm state cho shipping provider

```typescript
const [shippingProvider, setShippingProvider] = useState<'ghtk' | 'viettel-post'>('ghtk');
const [shippingFee, setShippingFee] = useState<number>(0);
```

### Bước 2: Thêm UI chọn nhà vận chuyển

```tsx
<div className="space-y-2">
  <Label>Nhà vận chuyển</Label>
  <Select value={shippingProvider} onValueChange={(value: any) => setShippingProvider(value)}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ghtk">Giao Hàng Tiết Kiệm (GHTK)</SelectItem>
      <SelectItem value="viettel-post">Viettel Post</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Bước 3: Tính phí ship theo provider được chọn

```typescript
const calculateShippingFee = async (shippingInfo: any) => {
  try {
    let feeResponse;

    if (shippingProvider === 'ghtk') {
      feeResponse = await GapService.getFeeForTransport(shippingInfo);
      if (feeResponse?.result) {
        setShippingFee(feeResponse.result);
      }
    } else if (shippingProvider === 'viettel-post') {
      feeResponse = await GapService.getViettelPostFee(shippingInfo, 0.2, 0, 0);
      if (feeResponse?.success) {
        setShippingFee(feeResponse.fee);
      }
    }
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    toast.error('Không thể tính phí vận chuyển');
  }
};
```

## Data Model Changes

Để hỗ trợ cả GHTK và Viettel Post, bạn có thể cân nhắc cập nhật Order schema:

```typescript
interface OrderItem {
  // ... existing fields

  // Option 1: Separate fields for each provider
  transporterGHTK?: TransporterInfo;
  transporterViettelPost?: {
    success?: boolean;
    orderNumber?: string;
    status?: number;
    statusName?: string;
    totalFee?: number;
    trackingInfo?: any;
  };

  // Option 2: Generic transporter with provider type
  transporter?: {
    provider: 'ghtk' | 'viettel-post';
    data: any;
  };
}
```

## Viettel Post Status Codes

Các mã trạng thái đơn hàng Viettel Post:

- `-1`: Đơn nháp
- `100`: Đơn hàng mới tạo
- `103`: Đã lấy hàng
- `104`: Đã nhập kho
- `201`: Đang giao hàng
- `500`: Đã giao hàng thành công
- `503`: Đang hoàn
- `504`: Đã hoàn
- `508`: Hủy đơn hàng
- `515`: Đơn hàng gặp sự cố

Mapping function có sẵn trong `src/services/shipping/viettel-post/types.ts`:

```typescript
import { VIETTEL_POST_STATUS_TRANSLATIONS } from '@/services/shipping/viettel-post/types';

const statusText = VIETTEL_POST_STATUS_TRANSLATIONS[statusCode] || 'Không xác định';
```

## Known Limitations & TODOs

1. **Province/District Mapping**: Hiện tại code đang sử dụng hardcoded IDs (provinceId: 1, districtId: 1). Cần implement mapping từ tên tỉnh/quận/phường sang ID của Viettel Post.

2. **Sender Address Configuration**: Địa chỉ người gửi đang hardcoded. Nên lưu vào settings hoặc config.

3. **Error Handling**: Cần improve error handling và retry logic cho các API calls.

4. **Authentication Token Caching**: ViettelPostService đã implement token caching, nhưng có thể cần improve với Redis hoặc database.

5. **Order Schema Update**: Cần update Parse Server Order schema để lưu thông tin Viettel Post riêng biệt khỏi GHTK.

## Testing

### Test Estimate Fee

```bash
curl -X POST http://localhost:3000/api/shipping/viettel-post/estimate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "senderProvinceId": 1,
    "senderDistrictId": 1,
    "receiverProvinceId": 1,
    "receiverDistrictId": 2,
    "weight": 0.5,
    "value": 100000
  }'
```

### Test Create Order

```bash
curl -X POST http://localhost:3000/api/shipping/viettel-post/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST001",
    "sender": {
      "name": "Giveaway Premium",
      "address": "1 Phó Đức Chính",
      "phone": "0703334443",
      "provinceId": 1,
      "districtId": 1,
      "wardId": 1
    },
    "receiver": {
      "name": "Nguyễn Văn A",
      "address": "123 Test Street",
      "phone": "0987654321",
      "provinceId": 1,
      "districtId": 2,
      "wardId": 1
    },
    "product": {
      "name": "Test Product",
      "quantity": 1,
      "price": 100000,
      "weight": 0.5
    }
  }'
```

## Support

Nếu gặp vấn đề khi tích hợp, check:

1. Environment variables đã được set chưa
2. Viettel Post credentials có đúng không
3. Check console logs để xem error messages
4. Verify API endpoints đang hoạt động: test bằng curl hoặc Postman

## Next Steps

1. Implement province/district/ward ID mapping
2. Add Viettel Post to TableOrder UI (follow example code above)
3. Add Viettel Post to SaleScreen UI (follow example code above)
4. Update Order schema to store Viettel Post data
5. Add comprehensive error handling
6. Implement retry logic for failed API calls
7. Add monitoring and logging
8. Create admin settings page for shipping configuration
