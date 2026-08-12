# CLAUDE.md — Company/Project Standards

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn-ui
- **State/Query:** React Query, React Router DOM
- **Backend/DB:** Supabase (Auth, Postgres, RLS)
- **Integrations:** SePay Webhook

## Architecture Patterns
- **Pages vs Components:** 
  - Thư mục `src/pages` chứa các route level components.
  - Thư mục `src/components` chứa các UI components dùng chung hoặc đặc thù của page nhưng không có route riêng.
- **Data Fetching:** Sử dụng `@tanstack/react-query` cho mọi API calls tới Supabase để quản lý cache và loading state.
- **Authentication:** Sử dụng `AuthProvider` context ở `src/contexts/AuthContext.tsx`. Bọc các route cần bảo vệ bằng `ProtectedRoute`.
- **Database:** Mọi bảng (table) trên Supabase phải có Row Level Security (RLS) policies chặt chẽ.

## Common Code Snippets / Tools
- Sử dụng `sonner` hoặc `toaster` cho các thông báo (toast notifications).
- Luôn sử dụng alias `@/` để import (ví dụ: `import { Button } from "@/components/ui/button"`).
