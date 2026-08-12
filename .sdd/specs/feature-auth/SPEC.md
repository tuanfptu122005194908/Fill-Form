# Feature 1: Authentication & Authorization Spec
# Version: 1.0.0 | Owner: AI Agent | Date: 2026-08-12

## 1. Context & Goal
Tính năng xác thực và phân quyền (Authentication & Authorization) giúp quản lý danh tính người dùng và bảo mật hệ thống. 
Mục tiêu: Đảm bảo chỉ có người dùng hợp lệ mới truy cập được các chức năng bảo vệ (dashboard) và chỉ có quản trị viên mới truy cập được trang Admin. 
Hệ thống sử dụng Supabase Auth để quản lý login/logout.

## 2. Actors & Roles
- **Guest (Khách):** Người chưa đăng nhập, chỉ có thể xem trang Landing Page (`/`) và trang Đăng nhập (`/login`).
- **User (Người dùng):** Người đã đăng nhập thành công. Được phép truy cập vào khu vực `/dashboard` để sử dụng tính năng nạp tiền, tạo/xem đơn hàng, lịch sử.
- **Admin (Quản trị viên):** Người dùng có quyền đặc biệt. Được phép truy cập vào khu vực `/admin` để quản lý hệ thống.

## 3. Functional Requirements
- WHEN Guest visits `/login`, THE system SHALL display a login form (email/password hoặc OAuth providers).
- WHEN Guest submits valid credentials, THE system SHALL authenticate the user and redirect to `/dashboard`.
- WHEN Guest submits invalid credentials, THE system SHALL display an error message "Invalid login credentials".
- WHEN User visits `/login`, THE system SHALL redirect them to `/dashboard`.
- WHEN User clicks "Logout", THE system SHALL invalidate their session and redirect them to `/login`.
- WHEN User visits any `/admin/*` routes, THE system SHALL deny access and redirect them to `/dashboard` or show a 403 Forbidden/Not Found error.
- WHEN Admin visits any `/admin/*` routes, THE system SHALL grant access to admin functionality.

## 4. Non-functional Requirements
- **Security:** Mật khẩu không bao giờ được lưu trữ bản rõ (handled by Supabase Auth). Sử dụng JWT token cho API authentication.
- **Performance:** Thời gian phản hồi xác thực không vượt quá 1000ms ở điều kiện mạng bình thường.

## 5. Data
- Hệ thống dựa trên Supabase `auth.users` schema.
- Custom claims / User profile table:
  - `id` (UUID): Liên kết với `auth.users.id`.
  - `role` (enum: 'user', 'admin'): Định danh quyền hạn.

## 6. Error Handling
- WHERE Supabase API returns 400 (Bad Request) on login, THE system SHALL display toast notification "Đăng nhập thất bại. Kiểm tra lại thông tin."
- WHERE User tries to access `/dashboard` without token, THE system SHALL redirect to `/login`.

## 7. Acceptance Criteria
- [ ] Truy cập `/dashboard` khi chưa đăng nhập bị chuyển hướng về `/login`.
- [ ] Đăng nhập thành công sẽ chuyển hướng về `/dashboard`.
- [ ] Đăng xuất thành công sẽ chuyển hướng về `/login`.
- [ ] User bình thường không thể truy cập `/admin`.
- [ ] Admin có thể truy cập `/admin` bình thường.
- [ ] Giao diện hiển thị thông báo lỗi khi nhập sai mật khẩu.

## 8. Out of Scope
- Không bao gồm Social Login (Google/Facebook) trong giai đoạn này (chỉ email/password).
- Không bao gồm Two-Factor Authentication (2FA).

## Notes / Open Questions
- Role của Admin đang được lưu trữ ở đâu? Bằng custom claims trên Supabase Auth hay ở bảng `profiles` riêng?
