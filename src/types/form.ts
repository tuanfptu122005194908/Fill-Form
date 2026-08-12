export interface FormField {
  entryId: string;
  name: string;
  type: number;
  typeLabel: string;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  pageIndex?: number; // 0-based: câu hỏi thuộc trang/phần nào
}

export interface GeneratedResponse {
  [entryId: string]: string;
}

export interface SubmitStatus {
  current: number;
  total: number;
  status: 'idle' | 'generating' | 'submitting' | 'paused' | 'completed' | 'error';
  message?: string;
}

// ---- Conditional / Branch types ----

export interface BranchOption {
  optionValue: string;    // Giá trị option kích hoạt nhánh (VD: "Đồ ăn")
  count: number;          // Số lượng phản hồi cho nhánh này
  fieldEntryIds: string[]; // Các entry.xxx thuộc nhánh này
}

export interface BranchConfig {
  triggerEntryId: string;  // entry ID của câu hỏi phân nhánh
  branches: BranchOption[]; // Các nhánh tương ứng với options
}

