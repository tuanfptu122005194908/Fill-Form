# Feature 5: Admin Management Spec
# Version: 1.0.0 | Owner: AI Agent | Date: 2026-08-12

## 1. Context & Goal
Tính năng quản trị hệ thống (Admin Management) cung cấp công cụ cho ban quản trị quản lý mọi hoạt động trên nền tảng `Fill-Form`.
Mục tiêu: Quản lý users, số dư ví, duyệt đơn hàng thủ công (nếu cần), tra cứu lịch sử form, lịch sử giao dịch và cấu hình hệ thống tổng thể.

## 2. Actors & Roles
- **Admin:** Quản trị viên hệ thống. Người dùng có trường `role = 'admin'`. Được quyền truy cập toàn bộ tính năng ở menu `/admin`.
- **System:** Lưu vết (Audit log) các thao tác của Admin để đảm bảo tính minh bạch (nếu cần).

## 3. Functional Requirements
- WHEN Admin visits `/admin`, THE system SHALL display an aggregate dashboard (Total users, Revenue, Active Orders).
- WHEN Admin visits `/admin/users`, THE system SHALL list all users with their current balances. Admin can view details, lock/unlock accounts.
- WHEN Admin edits a user's wallet manually in `/admin/wallets`, THE system SHALL update the balance AND create a corresponding 'admin_adjustment' transaction.
- WHEN Admin visits `/admin/orders`, THE system SHALL list all orders across the platform with filtering capabilities by status/date.
- WHEN Admin visits `/admin/transactions`, THE system SHALL display all financial transactions of all users for auditing.
- WHEN Admin visits `/admin/settings`, THE system SHALL allow them to update global parameters (e.g. system email, Webhook keys, default package pricing).

## 4. Non-functional Requirements
- **Security:** Mọi thao tác ghi/xóa ở phía admin đều phải được kiểm tra quyền (Authorization) ở cấp độ Database (Row Level Security - RLS).
- **Usability:** Các danh sách dài (Users, Orders) phải có chức năng tìm kiếm (Search) và lọc (Filter) hiệu quả.

## 5. Data
- Hệ thống sử dụng chung các bảng: `users`, `profiles`, `wallets`, `transactions`, `orders`, `form_history`.
- Cần thêm bảng `system_settings`:
  - `key` (text) - Primary key
  - `value` (JSONB)
  - `description` (text)

## 6. Error Handling
- WHERE Admin attempts to deduct a user's wallet below 0, THE system SHALL display an error "Số dư ví không thể âm".
- WHERE a non-admin user somehow bypasses frontend and hits admin API, THE system (Supabase RLS) SHALL return 401/403 and block the request.

## 7. Acceptance Criteria
- [ ] Admin Dashboard load thành công các thông số thống kê.
- [ ] Tính năng cộng/trừ tiền thủ công cho User hoạt động và sinh ra transaction log.
- [ ] RLS policies trên Supabase chỉ cho phép người dùng có `role='admin'` truy cập dữ liệu toàn hệ thống.
- [ ] Xem toàn bộ danh sách Orders và Form History thành công.
- [ ] Giao diện quản lý Admin trực quan, responsive.

## 8. Out of Scope
- Không bao gồm Export ra Excel/CSV trong phase này.
- Không bao gồm phân quyền cấp độ nhỏ hơn (như Super Admin vs Support Staff).

## Notes / Open Questions
- Thao tác thay đổi số tiền ở Admin có cần ghi log chi tiết lý do (reason/note) không?
