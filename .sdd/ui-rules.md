# UI Rules & Conventions

## 1. Component Library (shadcn/ui)
- Tất cả UI components cơ bản (Button, Input, Modal, Table...) phải được tạo thông qua CLI của `shadcn-ui`.
- Khi cần tạo component mới, trước tiên hãy tìm trong docs của shadcn xem có component tương đương không.
- KHÔNG thay đổi trực tiếp code trong thư mục `@/components/ui/` trừ khi bắt buộc phải customize riêng.

## 2. Styling (Tailwind CSS)
- KHÔNG sử dụng inline styles (`style={{ color: 'red' }}`). Bắt buộc sử dụng Tailwind classes.
- Tránh viết các custom classes trong CSS thuần (trừ `index.css` định nghĩa variables cho themer).
- Dùng tiện ích `cn()` (`clsx` + `tailwind-merge`) để gộp classes động thay vì nối string thông thường.
  Ví dụ: `className={cn("bg-red-500", isActive && "bg-blue-500")}`

## 3. Responsive Design
- Ưu tiên phương pháp Mobile-first. Bắt đầu style cho mobile, sau đó dùng các breakpoint `sm:`, `md:`, `lg:` để override.
- Luôn kiểm thử giao diện trên tối thiểu màn hình hẹp (375px) và màn rộng (1024px+).

## 4. Accessibility (a11y)
- Mọi hình ảnh phải có thuộc tính `alt`.
- Các nút nhấn (Buttons) phải có text hoặc `aria-label` nếu chỉ dùng Icon.
- Hỗ trợ keyboard navigation cơ bản.
