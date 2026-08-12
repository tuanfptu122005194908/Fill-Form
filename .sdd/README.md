# Spec-Driven Development (SDD) Repository
Đây là thư mục chứa toàn bộ tri thức (knowledge) và rules của dự án Fill-Form.

## Cấu trúc thư mục:
- `specs/`: Chứa đặc tả của từng tính năng dưới dạng `SPEC.md`. Mỗi tính năng (VD: Auth, Cart) nên có 1 thư mục riêng.
- `constitution.md`: Hiến pháp của dự án, mọi quy tắc tại đây không được vi phạm.
- `ui-rules.md`: Hướng dẫn về UI/UX (Tailwind, shadcn-ui, accessibility).
- `design.md`: Hướng dẫn về mặt hình ảnh (Màu sắc, Typography, Constraints, Layout).

## Quy trình làm việc với Agent:
1. Bạn yêu cầu tính năng.
2. Agent tạo đặc tả bằng lệnh CLI (`speckit specify`).
3. Dựa trên đặc tả, Agent đề xuất Implementation Plan.
4. Bạn Review.
5. Agent implement và bám sát các rules trong `.sdd/`, `.cursorrules` và `AGENTS.md`.
