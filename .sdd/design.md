# Hướng dẫn Thiết kế (Design Guidelines) - Fill-Form

## Tổng quan
Ứng dụng Fill-Form hướng đến thiết kế tối giản, sạch sẽ và hiện đại. Tập trung vào trải nghiệm người dùng (UX) khi điền form và quản lý thông tin.

## Colors
- Dựa trên Tailwind mặc định, ưu tiên sử dụng `slate` cho các thành phần trung tính.
- Các màu chủ đạo: `primary` (Thường là màu blue hoặc tone màu thương hiệu).
- Bắt buộc hỗ trợ Dark Mode và Light Mode đầy đủ.

## Typography
- Font mặc định: Inter hoặc Roboto (Sans-serif).
- Heading: Cần nổi bật, dễ đọc.
- Cấu trúc hằng số (constants) cho text sizes: sử dụng chuẩn Tailwind (text-sm, text-base, text-lg, text-xl...).

## Layout & Structure
- Các form điền thông tin nên hiển thị trên 1 cột cho mobile và tối đa 2 cột cho Desktop.
- Sử dụng grid/flexbox của Tailwind để căn chỉnh.
- Luôn giữ một khoảng padding/margin đồng nhất (thường là p-4, p-6, gap-4).

## Theme & Effects
- Khuyến khích sử dụng Glassmorphism ở mức độ nhẹ cho các card hoặc modal.
- `SakuraEffect`: Dự án có sử dụng hiệu ứng hoa anh đào (đã được implement). Cần đảm bảo các component UI ở z-index hợp lý để không đè lên text, nhưng vẫn giữ được tính thẩm mỹ.
