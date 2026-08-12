# Feature 4: Order Management Spec
# Version: 1.0.0 | Owner: AI Agent | Date: 2026-08-12

## 1. Context & Goal
Quản lý đơn hàng (Orders) và cốt lõi của ứng dụng `Fill-Form`. Người dùng mua các gói dịch vụ hoặc sản phẩm (đơn hàng) bằng số dư ví, sau đó sử dụng dịch vụ điền form. 
Mục tiêu: Đảm bảo luồng tạo đơn hàng, trừ tiền tự động và ghi nhận trạng thái đơn hàng hoạt động trơn tru.

## 2. Actors & Roles
- **User:** Người mua hàng. Có thể xem danh sách đơn hàng của chính họ và thực hiện quá trình điền form cho các đơn hàng đã thanh toán.
- **System:** Tự động trừ tiền và cập nhật trạng thái đơn.

## 3. Functional Requirements
- WHEN User chooses a package/product to buy, THE system SHALL check if their wallet balance is sufficient.
- WHILE Wallet balance is sufficient, THE system SHALL deduct the amount from the wallet, create a new `order` with status 'paid', AND create a payment transaction.
- WHILE Wallet balance is insufficient, THE system SHALL reject the purchase and prompt the user to top up.
- WHEN User visits `/dashboard/orders`, THE system SHALL display a list of their orders including Order ID, product name, price, and status.
- WHEN User clicks "Fill Form" on a valid order, THE system SHALL navigate them to the form filling interface.
- WHEN a form is successfully submitted, THE system SHALL update the order status to 'completed' (or 'processing') AND save the form history.

## 4. Non-functional Requirements
- **Data Integrity:** Việc tạo đơn hàng, trừ tiền ví, tạo transaction phải diễn ra trong cùng 1 database transaction (ACID properties).
- **Scalability:** Có thể mở rộng số lượng gói dịch vụ (products) một cách dễ dàng qua bảng database chứ không hard-code.

## 5. Data
- `orders` table:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - Foreign key
  - `product_id` (UUID) / `package_type` (text)
  - `amount` (numeric)
  - `status` (enum: 'pending', 'paid', 'completed', 'cancelled')
  - `created_at`, `updated_at` (timestamp)
- `products` table (optional if predefined in DB):
  - `id` (UUID)
  - `name` (text)
  - `price` (numeric)
  - `description` (text)

## 6. Error Handling
- WHERE User tries to place an order but balance changes concurrently leading to insufficient funds, THE system SHALL rollback the transaction and notify "Số dư không đủ".
- WHERE Form submission fails, THE system SHALL keep the order status as 'paid' and allow the user to retry.

## 7. Acceptance Criteria
- [ ] User có đủ tiền: Tạo đơn hàng thành công, số dư bị trừ, có transaction mới.
- [ ] User thiếu tiền: Tạo đơn hàng thất bại, báo lỗi thiếu tiền.
- [ ] Danh sách đơn hàng `/dashboard/orders` hiển thị đầy đủ và đúng lịch sử.
- [ ] Cho phép tiếp tục điền form đối với các đơn hàng ở trạng thái 'paid'.
- [ ] Hoàn thành điền form cập nhật đơn hàng thành 'completed'.

## 8. Out of Scope
- Không xử lý thanh toán trực tiếp qua cổng thanh toán ngoài cho từng đơn hàng (phải nạp tiền vào ví trước).
- Không có luồng refund tự động trong giai đoạn này.

## Notes / Open Questions
- Sản phẩm/gói dịch vụ hiện tại được hard-code ở frontend hay lấy từ bảng `products` trong DB?
