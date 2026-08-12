# PROJECT CONSTITUTION — Fill-Form
# Version: 1.0.0 | Owner: AI Agent | Status: LOCKED
# Áp dụng cho: mọi AI agent, mọi developer, mọi PR

═══════════════════════════════════════════════
LAYER 1: HARD RULES — KHÔNG BAO GIỜ VI PHẠM
═══════════════════════════════════════════════
## SEC-01: Bảo mật thông tin
THE system SHALL NOT lưu bất kỳ secret nào dưới dạng plaintext trong source code, config files, hoặc logs.
Áp dụng cho: API keys, passwords, tokens, PII.

## SEC-02: Row Level Security
THE system SHALL enforce RLS trên tất cả các bảng Supabase. KHÔNG CÓ BẢNG NÀO ĐƯỢC PHÉP public hoàn toàn nếu chứa thông tin nhạy cảm.

═══════════════════════════════════════════════
LAYER 2: ARCHITECTURE & DESIGN
═══════════════════════════════════════════════
## ARCH-01: Data Fetching
THE system SHALL dùng React Query (Tanstack Query) cho mọi tương tác data (fetch/mutation). Không dùng trực tiếp `useEffect` + `fetch` để quản lý state data.

## ARCH-02: UI Components
THE system SHALL sử dụng các UI elements từ `shadcn-ui`. Nếu không có, thiết kế component sử dụng Tailwind classes với cấu trúc tái sử dụng cao.

═══════════════════════════════════════════════
LAYER 3: STANDARDS & CONVENTIONS
═══════════════════════════════════════════════
- Test Coverage: Unit tests (nếu có) phải đảm bảo.
- Git Commits: Bắt buộc tuân theo Conventional Commits (feat, fix, chore, docs).
