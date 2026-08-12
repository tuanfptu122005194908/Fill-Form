import { FormField } from '@/types/form';

export function getTypeLabel(type: number): string {
  switch (type) {
    case 0: return 'Văn bản ngắn';
    case 1: return 'Đoạn văn';
    case 2: return 'Trắc nghiệm';
    case 3: return 'Dropdown';
    case 4: return 'Checkbox';
    case 5: return 'Thang đo';
    case 7: return 'Lưới';
    case 9: return 'Ngày tháng';
    case 10: return 'Thời gian';
    case 18: return 'Đánh giá sao';
    default: return 'Văn bản';
  }
}

export interface ParseResult {
  fields: FormField[];
  pageCount: number;
  /** Map: pageIndex (0-based) → tiêu đề section (hoặc "Phần X" nếu không có tiêu đề) */
  pageBreakMap: Map<number, string>;
}

export function parseFormHtml(htmlSource: string): ParseResult {
  const fields: FormField[] = [];
  const pageBreakMap = new Map<number, string>();
  pageBreakMap.set(0, 'Phần 1'); // trang đầu tiên luôn là trang 0

  try {
    const regex = /FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/;
    const match = htmlSource.match(regex);

    if (!match || match.length < 2) {
      throw new Error('Không tìm thấy dữ liệu cấu trúc Form (FB_PUBLIC_LOAD_DATA_)');
    }

    const jsonString = match[1];
    
    // Parse the Google Form data structure
    const formStructure = new Function(`return ${jsonString}`)();
    
    // Google Forms stores questions across all pages in formStructure[1][1]
    let questionsArray = formStructure?.[1]?.[1];

    if (!questionsArray || !Array.isArray(questionsArray)) {
      const formData = formStructure?.[1];
      if (formData && Array.isArray(formData)) {
        for (const item of formData) {
          if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
            questionsArray = item;
            break;
          }
        }
      }
      if (!questionsArray || !Array.isArray(questionsArray)) {
        throw new Error('Không tìm thấy mảng câu hỏi trong Form');
      }
    }

    // First pass: build page break map & track which pageIndex each question gets
    let currentPage = 0;
    const questionPageMap: number[] = []; // index in questionsArray → pageIndex

    questionsArray.forEach((q: any, qIdx: number) => {
      if (!q || !Array.isArray(q)) {
        questionPageMap.push(currentPage);
        return;
      }
      const type = q[3];
      if (type === 8) {
        // Page break — increment page counter and record section title
        currentPage++;
        const sectionTitle = (q[1] || '').replace(/<[^>]*>/g, '').trim();
        pageBreakMap.set(currentPage, sectionTitle || `Phần ${currentPage + 1}`);
      }
      questionPageMap.push(currentPage);
    });

    // Second pass: extract fields
    questionsArray.forEach((q: any, qIdx: number) => {
      if (!q || !Array.isArray(q)) return;
      
      const questionData = q[4];
      if (!questionData || !Array.isArray(questionData) || questionData.length === 0) return;

      const name = (q[1] || 'Không có tiêu đề')
        .replace(/<[^>]*>/g, '')
        .replace(/\r?\n|\r/g, ' ')
        .trim();

      const type = q[3] || 0;
      const pageIndex = questionPageMap[qIdx] ?? 0;

      // Grid questions (type 7) - each row is a separate field
      if (type === 7) {
        questionData.forEach((rowData: any, rowIdx: number) => {
          if (!rowData || !Array.isArray(rowData)) return;
          const entryId = rowData[0];
          if (!entryId) return;

          let rowLabel = `Hàng ${rowIdx + 1}`;
          if (rowData[3] && Array.isArray(rowData[3]) && rowData[3][0]) {
            rowLabel = String(rowData[3][0]).replace(/<[^>]*>/g, '').trim();
          }

          let options: string[] | undefined;
          if (rowData[1] && Array.isArray(rowData[1])) {
            options = rowData[1]
              .filter((opt: any) => opt && Array.isArray(opt) && opt[0] !== undefined && opt[0] !== '')
              .map((opt: any) => String(opt[0]).trim())
              .filter((opt: string) => opt.length > 0);
          }

          fields.push({
            entryId: `entry.${entryId}`,
            name: `${name} — ${rowLabel}`,
            type: 7,
            typeLabel: 'Lưới',
            options,
            pageIndex,
          });
        });
        return;
      }

      const entryData = questionData[0];
      if (!entryData || !Array.isArray(entryData)) return;

      const entryId = entryData[0];
      if (!entryId) return;
      
      let options: string[] | undefined;
      if ([2, 3, 4].includes(type) && entryData[1] && Array.isArray(entryData[1])) {
        options = entryData[1]
          .filter((opt: any) => opt && Array.isArray(opt) && opt[0] !== undefined && opt[0] !== '')
          .map((opt: any) => String(opt[0]).trim())
          .filter((opt: string) => opt.length > 0);
      }

      let scaleMin: number | undefined;
      let scaleMax: number | undefined;
      if ([5, 18].includes(type) && entryData[1] && Array.isArray(entryData[1])) {
        const scaleOptions = entryData[1].filter((opt: any) => opt && Array.isArray(opt) && opt[0]);
        scaleMin = 1;
        scaleMax = scaleOptions.length || 5;
        options = scaleOptions.map((opt: any) => String(opt[0]).trim());
      }

      fields.push({
        entryId: `entry.${entryId}`,
        name,
        type,
        typeLabel: getTypeLabel(type),
        options,
        scaleMin,
        scaleMax,
        pageIndex,
      });
    });

    // Count pages
    let pageCount = 1;
    questionsArray.forEach((q: any) => {
      if (q && Array.isArray(q) && q[3] === 8) pageCount++;
    });

    return { fields, pageCount, pageBreakMap };
  } catch (error) {
    console.error('Error parsing form HTML:', error);
    throw error;
  }
}

export function getSubmitUrl(formUrl: string): string {
  let submitUrl = formUrl.replace('/viewform', '/formResponse');
  submitUrl = submitUrl.replace('/edit', '/formResponse');
  
  try {
    const urlObj = new URL(submitUrl);
    return urlObj.origin + urlObj.pathname;
  } catch {
    return submitUrl;
  }
}

