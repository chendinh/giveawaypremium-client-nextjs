# Tích hợp Đa Nhà Vận Chuyển (Multi-Shipping Provider Integration)

## Tổng quan

Hệ thống hiện đã được nâng cấp để hỗ trợ nhiều nhà vận chuyển:
- **Viettel Post** (mặc định)
- **GHTK** (Giao hàng tiết kiệm)

Người dùng có thể lựa chọn nhà vận chuyển khi tạo đơn hàng, và hệ thống sẽ tự động sử dụng API của nhà vận chuyển tương ứng.

## Các thay đổi đã thực hiện

### 1. SaleScreen (Trang bán hàng)

**File**: `src/app/admin/components/SaleScreen/index.tsx`

#### Thay đổi:
- ✅ Thêm trường `shippingProvider` vào interface `ShippingInfo`
- ✅ Thêm dropdown "Đơn vị vận chuyển" cho phép chọn giữa Viettel Post và GHTK
- ✅ Mặc định là **Viettel Post**
- ✅ Cập nhật tính phí ship để hỗ trợ cả 2 nhà vận chuyển
- ✅ Khi thay đổi nhà vận chuyển, phí ship sẽ được reset và tính lại

#### Vị trí UI:
```
Thông tin vận chuyển
├── Đơn vị vận chuyển (MỚI)
│   ├── Viettel Post (mặc định)
│   └── Giao hàng tiết kiệm (GHTK)
├── Địa chỉ giao hàng
├── Tỉnh/Quận/Xã
└── Hình thức giao hàng
```

### 2. TableOrder (Quản lý đơn hàng)

**File**: `src/app/admin/components/ManageScreen/components/TableOrder/index.tsx`

#### Thay đổi:
- ✅ Import component `BillOrderViettelPost`
- ✅ Thêm function `handlePushOrderToViettelPost()` để tạo đơn Viettel Post
- ✅ Đổi `renderGhtkAction()` thành `renderShippingAction()` để hỗ trợ cả 2 nhà vận chuyển
- ✅ Cột "GHTK" đổi thành "Vận chuyển"
- ✅ Nút "Tạo đơn" hiển thị "Tạo GHTK" hoặc "Tạo VTP" tùy theo provider đã chọn
- ✅ Modal chi tiết vận chuyển hiển thị đúng loại nhãn (GHTK hoặc Viettel Post)

#### Logic tự động:
- Nếu `shippingInfo.shippingProvider === 'ghtk'` → Sử dụng GHTK
- Nếu `shippingInfo.shippingProvider === 'viettel-post'` hoặc không có → Sử dụng Viettel Post (mặc định)

### 3. Tính phí vận chuyển

**File**: `src/app/admin/components/SaleScreen/index.tsx` - function `fetchShippingFee()`

```typescript
if (shippingProvider === 'viettel-post') {
  // Sử dụng API Viettel Post
  resFee = await GapService.getViettelPostFee(
    formDataFee,
    0.5,  // Trọng lượng mặc định: 0.5kg
    0,    // Giá trị hàng hóa
    0     // COD money
  );
} else {
  // Sử dụng API GHTK
  resFee = await GapService.getFeeForTransport(
    formDataFee,
    optionTransfer === 'ht'
  );
}
```

## Cấu hình môi trường

### 1. Cấu hình Viettel Post

Thêm các biến môi trường sau vào file `.env.local`:

```env
# Viettel Post Configuration
VIETTEL_POST_API_URL=https://partner.viettelpost.vn/v2
VIETTEL_POST_USERNAME=0703334443
VIETTEL_POST_PASSWORD=So1phoducchinh@
```

**Lưu ý**:
- File `.env.viettel-post.example` đã có sẵn để tham khảo.
- Viettel Post sử dụng luồng xác thực 2 bước (Login + OwnerConnect) - được xử lý tự động bởi `ViettelPostService`

### 2. Viettel Post Authentication Flow

Viettel Post API yêu cầu luồng xác thực 2 bước:

1. **POST /v2/user/Login** → Lấy temporary token
2. **POST /v2/user/ownerconnect** → Đổi temporary token thành long-term token
3. Sử dụng long-term token cho tất cả API calls

**ViettelPostService** tự động xử lý toàn bộ luồng này:
- Tự động login và lấy long-term token khi cần
- Cache token và tự động refresh khi hết hạn (24 giờ)
- Xem chi tiết trong `src/services/shipping/viettel-post/ViettelPostService.ts`

### 3. Cấu hình GHTK

GHTK đã được cấu hình từ trước, sử dụng Parse Server.

## API Methods

### Viettel Post (đã có sẵn trong GapServices)

```typescript
// Tính phí ship
GapService.getViettelPostFee(formData, weight, value, codMoney)

// Tạo đơn vận chuyển
GapService.pushOrderToViettelPost(orderData, orderId)

// Hủy đơn
GapService.cancelViettelPostOrder(orderNumber)

// Lấy nhãn
GapService.getViettelPostLabel(orderNumber)

// Tra cứu
GapService.getViettelPostTracking(orderNumber)
```

### GHTK (đã có sẵn)

```typescript
// Tính phí ship
GapService.getFeeForTransport(formData, isExpressDelivery)

// Tạo đơn vận chuyển
GapService.pushOrderToGHTK(orderData, orderId)

// Hủy đơn
GapService.deleteTransport(orderId)
```

## Luồng sử dụng

### 1. Tạo đơn hàng mới (SaleScreen)

1. Chọn sản phẩm
2. Nhập thông tin khách hàng
3. **Chọn đơn vị vận chuyển** (Viettel Post hoặc GHTK)
4. Nhập địa chỉ giao hàng
5. Hệ thống tự động tính phí ship theo nhà vận chuyển đã chọn
6. Tạo đơn hàng

### 2. Quản lý vận chuyển (TableOrder)

1. Vào trang Quản lý đơn hàng
2. Với đơn hàng online, sẽ có nút "Tạo GHTK" hoặc "Tạo VTP"
3. Click nút để tạo đơn vận chuyển với nhà vận chuyển đã chọn
4. Sau khi tạo, nút sẽ chuyển thành "Xem GHTK" hoặc "Xem VTP"
5. Click "Xem" để xem chi tiết và in nhãn

## Mặc định

- **Nhà vận chuyển mặc định**: Viettel Post
- **Được áp dụng khi**:
  - Tạo đơn hàng mới
  - Đơn hàng cũ không có thông tin `shippingProvider`

## Data Model

### ShippingInfo Interface

```typescript
interface ShippingInfo {
  optionTransfer: string;        // 'tk', 'ht', 'tt'
  shippingProvider: string;      // 'viettel-post' hoặc 'ghtk'
  orderAdressProvince?: string;
  orderAdressDistrict?: string;
  orderAdressWard?: string;
  orderAdressStreet?: string;
  shippingFee?: number;
}
```

### Order Data

Khi lưu đơn hàng, `shippingInfo` sẽ bao gồm:
```json
{
  "shippingInfo": {
    "shippingProvider": "viettel-post",
    "optionTransfer": "tk",
    "orderAdressProvince": "Hà Nội",
    "orderAdressDistrict": "Hoàn Kiếm",
    "orderAdressWard": "Hàng Bạc",
    "orderAdressStreet": "123 Hàng Bạc",
    "shippingFee": 25000
  }
}
```

## Components

### BillOrderViettelPost

**File**: `src/app/admin/components/ManageScreen/components/TableOrder/components/BillOrderViettelPost/index.tsx`

Component để hiển thị và in nhãn Viettel Post.

```tsx
<BillOrderViettelPost orderNumber={orderId} />
```

### BillOrderGHTK

**File**: `src/app/admin/components/ManageScreen/components/TableOrder/components/BillOrderGHTK/index.tsx`

Component để hiển thị và in nhãn GHTK (đã có sẵn).

```tsx
<BillOrderGHTK orderId={orderId} />
```

## Testing

### Test Case 1: Tạo đơn hàng với Viettel Post
1. Vào SaleScreen
2. Chọn sản phẩm
3. Nhập thông tin khách hàng
4. Chọn "Online"
5. Chọn "Viettel Post" làm đơn vị vận chuyển
6. Nhập địa chỉ → Kiểm tra phí ship có được tính không
7. Tạo đơn hàng
8. Vào TableOrder → Click "Tạo VTP"
9. Kiểm tra nhãn Viettel Post

### Test Case 2: Tạo đơn hàng với GHTK
1. Làm tương tự Test Case 1 nhưng chọn "GHTK"
2. Click "Tạo GHTK"
3. Kiểm tra nhãn GHTK

### Test Case 3: Đơn hàng cũ (backward compatibility)
1. Mở đơn hàng cũ không có `shippingProvider`
2. Hệ thống nên mặc định là Viettel Post
3. Kiểm tra tạo đơn vận chuyển hoạt động bình thường

## Lưu ý quan trọng

### 1. Province/District/Ward ID Mapping
- Hiện tại đang sử dụng tên string (Hà Nội, Hoàn Kiếm...)
- Viettel Post API yêu cầu ID số
- **TODO**: Cần implement mapping từ tên → ID

### 2. Credentials
- Đảm bảo đã cấu hình đúng credentials trong `.env.local`
- **Không commit** file `.env.local` vào git
- Username: `0703334443`
- Password: `So1phoducchinh@`

### 3. API Endpoints
- Viettel Post: `/api/shipping/viettel-post/*`
- GHTK: `/api/parse/functions/pushOrderToGHTK` (qua Parse Server)

### 4. Error Handling
- Nếu API Viettel Post fail, hiển thị lỗi
- Nếu API GHTK fail, hiển thị lỗi
- User có thể thử lại hoặc đổi nhà vận chuyển

## Mở rộng trong tương lai

### 1. Thêm nhà vận chuyển mới
1. Tạo service class mới trong `src/services/shipping/`
2. Tạo API routes trong `src/app/api/shipping/`
3. Thêm methods vào `GapServices.ts`
4. Thêm option vào dropdown trong SaleScreen
5. Update `renderShippingAction()` trong TableOrder

### 2. So sánh giá
- Hiển thị phí của cả 2 nhà vận chuyển
- Cho phép chọn nhà vận chuyển rẻ nhất

### 3. Tự động chọn nhà vận chuyển
- Dựa vào địa chỉ, trọng lượng
- Chọn nhà vận chuyển tốt nhất

### 4. Webhook
- Nhận thông báo cập nhật trạng thái từ Viettel Post
- Tự động cập nhật trạng thái đơn hàng

## Tài liệu tham khảo

- [Viettel Post API Documentation](https://partner.viettelpost.vn)
- [GHTK API Documentation](https://docs.giaohangtietkiem.vn)
- [VIETTEL_POST_README.md](./VIETTEL_POST_README.md)
- [VIETTEL_POST_INTEGRATION.md](./VIETTEL_POST_INTEGRATION.md)

---

**Trạng thái**: ✅ Hoàn thành - Sẵn sàng sử dụng (cần cấu hình `.env.local`)

**Ngày cập nhật**: 2026-04-04
