# Feature 3: Financial & Transactions Spec
# Version: 1.0.0 | Owner: AI Agent | Date: 2026-08-12

## 1. Context & Goal
Quản lý ví điện tử, nạp tiền và lịch sử giao dịch của người dùng trên hệ thống. 
Mục tiêu: Cho phép người dùng nạp tiền tự động qua tích hợp SePay bằng mã QR, tự động cộng tiền vào ví và ghi nhận giao dịch (transaction) minh bạch.

## 2. Actors & Roles
- **User:** Thực hiện giao dịch nạp tiền, xem lịch sử biến động số dư.
- **System/Webhook (SePay):** Gửi thông báo khi có giao dịch chuyển khoản thành công để hệ thống tự động cộng tiền.

## 3. Functional Requirements
- WHEN User visits `/dashboard/topup`, THE system SHALL display an interface with a QR code for banking transfer (SePay).
- WHEN the user inputs a top-up amount, THE system SHALL generate a QR code with the exact amount and a specific transfer syntax (e.g. `NAP [User_ID]`).
- WHEN Webhook from SePay is received with a valid transfer syntax, THE system SHALL verify the transaction signature.
- WHILE Webhook signature is valid AND transaction has not been processed, THE system SHALL add the amount to the corresponding user's wallet AND create a transaction record.
- WHEN User visits `/dashboard/transactions`, THE system SHALL display a paginated history of their transactions (Top-ups, Deductions).

## 4. Non-functional Requirements
- **Reliability:** Webhook handler phải đảm bảo tính Idempotency (không xử lý cộng tiền 2 lần cho 1 giao dịch từ ngân hàng).
- **Security:** API webhook cần xác thực chữ ký (Signature/Token) từ SePay để tránh giả mạo request.
- **Atomicity:** Việc cộng số dư (wallet) và ghi lịch sử giao dịch (transactions) phải được thực hiện trong 1 database transaction.

## 5. Data
- `wallets` table:
  - `id` (UUID)
  - `user_id` (UUID) - Foreign key
  - `balance` (numeric)
- `transactions` table:
  - `id` (UUID)
  - `user_id` (UUID)
  - `amount` (numeric)
  - `type` (enum: 'deposit', 'withdrawal', 'payment')
  - `status` (enum: 'pending', 'success', 'failed')
  - `reference_code` (text) - Mã giao dịch ngân hàng / SePay.
  - `created_at` (timestamp)

## 6. Error Handling
- WHERE Webhook receives an invalid signature, THE system SHALL return 401 Unauthorized and log the event.
- WHERE Webhook receives a valid transaction but user is not found based on syntax, THE system SHALL log as "unmapped_transaction" for manual review.
- WHERE User tries to view transactions but backend fails, THE system SHALL show "Không thể tải dữ liệu giao dịch".

## 7. Acceptance Criteria
- [ ] Màn hình TopUp tạo đúng QR code với số tiền và cú pháp chuyển khoản.
- [ ] Webhook SePay hoạt động, cộng đúng số tiền vào ví user.
- [ ] Transaction history hiển thị chính xác dòng tiền vừa được cộng.
- [ ] Xử lý trùng lặp webhook: gửi 2 lần cùng 1 mã giao dịch ngân hàng chỉ cộng tiền 1 lần.
- [ ] Danh sách giao dịch `/dashboard/transactions` sắp xếp theo thời gian mới nhất.

## 8. Out of Scope
- Rút tiền (Withdrawal) về tài khoản ngân hàng.
- Nạp tiền qua thẻ tín dụng (Visa/Mastercard) hay cổng thanh toán khác ngoài SePay.

## Notes / Open Questions
- Syntax chuyển khoản được sinh ra dựa trên `user_id` hay một chuỗi random code sinh ra trước mỗi phiên nạp tiền?
