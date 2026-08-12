# Feature 2: User Dashboard & Profile Spec
# Version: 1.0.0 | Owner: AI Agent | Date: 2026-08-12

## 1. Context & Goal
Tính năng User Dashboard và Profile cung cấp cho người dùng một trang tổng quan để quản lý thông tin cá nhân và xem lịch sử điền form của họ.
Mục tiêu: Đảm bảo người dùng có cái nhìn tổng quát về hoạt động của họ trên hệ thống `Fill-Form` và có thể tùy chỉnh thông tin tài khoản một cách dễ dàng, trực quan.

## 2. Actors & Roles
- **User:** Người dùng đã đăng nhập. Chỉ có thể xem và chỉnh sửa thông tin của chính họ. Không được phép xem thông tin của User khác.

## 3. Functional Requirements
- WHEN User visits `/dashboard/profile`, THE system SHALL display the user's current profile information (Email, Name, Avatar...).
- WHEN User submits a form to update profile, THE system SHALL validate the input and update the information in the database.
- WHEN User visits `/dashboard/history`, THE system SHALL display a paginated list of all forms previously submitted by the user.
- WHEN User clicks on a specific form history item, THE system SHALL display the details of that submission.
- WHEN User visits `/dashboard`, THE system SHALL display a summary of their account (balance, recent orders, recent forms).

## 4. Non-functional Requirements
- **Usability:** Giao diện cần tương thích hoàn toàn với các thiết bị di động (Responsive).
- **Performance:** Thời gian tải lịch sử điền form không quá 2 giây (cần phân trang hoặc lazy loading).

## 5. Data
- `profiles` table:
  - `id` (UUID) - Primary key
  - `full_name` (text)
  - `avatar_url` (text)
  - `updated_at` (timestamp)
- `form_history` table:
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - Foreign key
  - `form_data` (JSONB)
  - `submitted_at` (timestamp)

## 6. Error Handling
- WHERE User tries to update profile with invalid data (e.g. invalid email format or name too short), THE system SHALL display inline validation errors.
- WHERE Database update fails, THE system SHALL display a toast notification "Không thể cập nhật hồ sơ lúc này. Vui lòng thử lại sau."
- WHERE User has no form history, THE system SHALL display an empty state "Bạn chưa điền form nào".

## 7. Acceptance Criteria
- [ ] Truy cập `/dashboard/profile` hiển thị đúng thông tin của tài khoản hiện tại.
- [ ] Cập nhật thông tin profile thành công và lưu vào database.
- [ ] Báo lỗi nếu input cập nhật profile không hợp lệ.
- [ ] `/dashboard/history` hiển thị danh sách form đã điền theo thứ tự mới nhất.
- [ ] Hiển thị Empty State nếu chưa có lịch sử form.

## 8. Out of Scope
- Đổi mật khẩu hoặc xóa tài khoản vĩnh viễn (sẽ được implement ở phase sau hoặc tính năng riêng).
- Tải lên ảnh avatar trực tiếp (sẽ sử dụng URL ảnh trước).

## Notes / Open Questions
- Form_data được lưu dưới dạng JSONB hay các cột riêng biệt?
