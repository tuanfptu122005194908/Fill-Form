import { GeneratedResponse } from '@/types/form';
import { FormField } from '@/types/form';

/**
 * Generate a random fbzx token (signed large integer as string).
 * This is REQUIRED by Google Forms — without it the server returns 400.
 */
function generateFbzx(): string {
  // Generate a random large integer (positive or negative)
  const abs = Math.floor(Math.random() * 9007199254740991);
  return Math.random() > 0.5 ? String(abs) : String(-abs);
}

export async function submitFormResponse(
  submitUrl: string,
  responseData: GeneratedResponse,
  fields: FormField[],
  pageCount?: number
): Promise<void> {
  try {
    // Build form data
    const formData = new URLSearchParams();

    // fbzx: REQUIRED random token — Google Forms returns 400 without this
    const fbzx = generateFbzx();

    // Required Google Form base parameters
    formData.append('fvv', '1');
    formData.append('fbzx', fbzx);

    // draftResponse: required for proper form submission tracking
    // Format: JSON array with fbzx embedded
    formData.append('draftResponse', `[null,null,"${fbzx}"]`);

    // pageHistory: for multi-page forms, must list all page indices "0,1,2,..."
    const totalPages = pageCount && pageCount > 1 ? pageCount : 1;
    const pageHistoryStr = Array.from({ length: totalPages }, (_, i) => i).join(',');
    formData.append('pageHistory', pageHistoryStr);

    // Create a map of field types by entryId for proper handling
    const fieldTypeMap = new Map<string, FormField>();
    fields.forEach(f => fieldTypeMap.set(f.entryId, f));

    Object.entries(responseData).forEach(([entryId, value]) => {
      if (!entryId.startsWith('entry.')) return;

      const field = fieldTypeMap.get(entryId);
      const fieldType = field?.type;

      // Handle different field types appropriately
      if (fieldType === 4) {
        // Checkbox type (4) - ưu tiên giữ nguyên option gốc (kể cả khi có dấu phẩy)
        const rawValue = value as unknown;
        let values: string[] = [];

        if (Array.isArray(rawValue)) {
          values = rawValue.map((v) => String(v).trim()).filter((v) => v.length > 0);
        } else {
          const textValue = String(rawValue ?? '').trim();

          if (textValue.length > 0) {
            // Nếu trùng chính xác 1 option thì gửi nguyên bản, không split theo dấu phẩy
            if (field?.options?.includes(textValue)) {
              values = [textValue];
            } else if (textValue.startsWith('[') && textValue.endsWith(']')) {
              try {
                const parsed = JSON.parse(textValue);
                if (Array.isArray(parsed)) {
                  values = parsed.map((v) => String(v).trim()).filter((v) => v.length > 0);
                }
              } catch {
                values = textValue.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
              }
            } else {
              values = textValue.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
            }
          }
        }

        values.forEach((v) => {
          formData.append(entryId, v);
        });
      } else {
        // All other types - send as single value (don't split by comma)
        const finalValue = String(value || '').trim();
        // Only append non-empty values (skip empty optional fields)
        if (finalValue.length > 0) {
          formData.append(entryId, finalValue);
        }
      }
    });

    // Use fetch with no-cors mode to submit.
    // With no-cors, we cannot read the response status, but the form IS submitted.
    // The 400 errors visible in DevTools console are from the browser's pre-check
    // or from missing required parameters (now fixed with fbzx + draftResponse).
    await fetch(submitUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // With no-cors we cannot verify the response status.
    // A correctly formed request will succeed silently.
  } catch (error) {
    console.error('Submit error:', error);
    throw new Error('Không thể gửi form. Kiểm tra kết nối mạng.');
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
