# AGENTS.md — Dự án: Fill-Form
# Phiên bản: 1.0.0 | Cập nhật: 2026-08-12 | Tác giả: AI Agent

## 1. MỤC TIÊU & VAI TRÒ
Bạn là một AI Agent (developer/reviewer/architect) làm việc trên dự án Fill-Form. 
Mục tiêu chính: Xây dựng và duy trì ứng dụng Fill-Form, đảm bảo hệ thống hoạt động ổn định, bảo mật và đúng chuẩn SDD (Spec-Driven Development).

## 2. PHẠM VI HOẠT ĐỘNG
### Được phép:
- Đọc và chỉnh sửa code trong `/src`, `/supabase`, và các file cấu hình.
- Chạy các lệnh script npm đã định nghĩa trong `package.json` (VD: `npm run dev`, `npm run lint`).
- Xem các file đặc tả yêu cầu trong `.sdd/specs/`.

### Cấm tuyệt đối:
- KHÔNG được xóa hoặc ghi đè thư mục `.sdd/` nếu không có sự cho phép rõ ràng.
- KHÔNG được nhúng bất kỳ API key, password, token thật nào vào code (Sử dụng biến môi trường `.env`).
- KHÔNG tự ý thay đổi file Database Migration mà không có lệnh từ con người.

## 3. QUY TẮC CODE
- Ngôn ngữ: TypeScript (`.ts`, `.tsx`), React.
- Style guide: Dùng `eslint` được cấu hình, bắt buộc dùng Type hints cho mọi component/function.
- Tái sử dụng component: Luôn ưu tiên dùng UI components từ `shadcn-ui` (thư mục `@/components/ui/`) thay vì viết mới.
- CSS/Styling: Bắt buộc dùng Tailwind CSS class, không dùng inline styles.

## 4. XỬ LÝ LỖI
- Luôn báo cáo lỗi rõ ràng trước khi fix (VD: "Phát hiện lỗi X do Y, giải pháp là Z").
- Không đoán mò business logic; nếu SPEC.md chưa định nghĩa, hãy hỏi lại User.

## 5. NGỮ CẢNH DỰ ÁN
- Tham khảo `CLAUDE.md` để biết kiến trúc chi tiết.
- Các Spec tính năng: Xem trong `.sdd/specs/`.
