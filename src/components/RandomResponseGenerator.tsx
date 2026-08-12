import { useState, useEffect, useCallback } from 'react';
import { Shuffle, Play, Percent, Users, Sparkles, Loader2, GitBranch, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, GeneratedResponse, BranchConfig } from '@/types/form';
import { toast } from '@/hooks/use-toast';
import { generateWithGroq, cleanAIResponse } from '@/lib/groq';
import { BranchConfigPanel } from './BranchConfig';

interface RandomResponseGeneratorProps {
  fields: FormField[];
  onResponsesReady: (responses: GeneratedResponse[]) => void;
  maxCount?: number;
  pageBreakMap?: Map<number, string>;
}

interface FieldPercentages {
  [entryId: string]: number[];
}

interface FieldCounts {
  [entryId: string]: number[];
}

interface FieldTextAnswers {
  [entryId: string]: string;
}

type RandomMode = 'percentage' | 'count';

/**
 * Distribute `remaining` among `count` slots, each > 0, summing to `remaining`.
 * Values are rounded to 2 decimals.
 */
function randomDistribute(remaining: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [Math.round(remaining * 100) / 100];

  // Generate random breakpoints
  const breaks: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    // Ensure each slot gets at least 0.01%
    breaks.push(Math.random());
  }
  breaks.sort((a, b) => a - b);

  const raw: number[] = [];
  let prev = 0;
  for (const b of breaks) {
    raw.push(b - prev);
    prev = b;
  }
  raw.push(1 - prev);

  // Scale to remaining, ensure min 0.01
  const minVal = 0.01;
  const totalMin = minVal * count;
  const distributable = remaining - totalMin;

  if (distributable < 0) {
    // Edge case: not enough to give everyone 0.01
    const each = Math.round((remaining / count) * 100) / 100;
    const result = Array(count).fill(each);
    // Fix rounding
    const diff = Math.round((remaining - each * count) * 100) / 100;
    result[0] = Math.round((result[0] + diff) * 100) / 100;
    return result;
  }

  const result = raw.map(r => Math.round((minVal + r * distributable) * 100) / 100);

  // Fix rounding error on last element
  const sum = result.reduce((a, b) => a + b, 0);
  const diff = Math.round((remaining - sum) * 100) / 100;
  result[result.length - 1] = Math.round((result[result.length - 1] + diff) * 100) / 100;

  return result;
}

/**
 * Distribute `remaining` count among `count` slots, each >= 0, summing to `remaining`.
 * Values are integers.
 */
function randomDistributeCounts(remaining: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [remaining];

  // Generate random breakpoints
  const breaks: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    breaks.push(Math.random());
  }
  breaks.sort((a, b) => a - b);

  const raw: number[] = [];
  let prev = 0;
  for (const b of breaks) {
    raw.push(b - prev);
    prev = b;
  }
  raw.push(1 - prev);

  // Scale to remaining
  const result = raw.map(r => Math.round(r * remaining));

  // Fix rounding error on last element
  const sum = result.reduce((a, b) => a + b, 0);
  const diff = remaining - sum;
  result[result.length - 1] += diff;

  return result;
}

function initPercentages(fields: FormField[]): FieldPercentages {
  const p: FieldPercentages = {};
  for (const field of fields) {
    if ([2, 3, 4, 7].includes(field.type) && field.options && field.options.length > 0) {
      p[field.entryId] = randomDistribute(100, field.options.length);
    } else if ([5, 18].includes(field.type)) {
      const min = field.scaleMin ?? 1;
      const max = field.scaleMax ?? 5;
      const count = max - min + 1;
      p[field.entryId] = randomDistribute(100, count);
    }
  }
  return p;
}

function initCounts(fields: FormField[], totalResponses: number): FieldCounts {
  const c: FieldCounts = {};
  for (const field of fields) {
    if ([2, 3, 4, 7].includes(field.type) && field.options && field.options.length > 0) {
      c[field.entryId] = randomDistributeCounts(totalResponses, field.options.length);
    } else if ([5, 18].includes(field.type)) {
      const min = field.scaleMin ?? 1;
      const max = field.scaleMax ?? 5;
      const count = max - min + 1;
      c[field.entryId] = randomDistributeCounts(totalResponses, count);
    }
  }
  return c;
}

export function RandomResponseGenerator({ fields, onResponsesReady, maxCount, pageBreakMap }: RandomResponseGeneratorProps) {
  const [generatorMode, setGeneratorMode] = useState<'full' | 'branch'>('full');
  const [branchConfig, setBranchConfig] = useState<BranchConfig | undefined>(undefined);
  const [count, setCount] = useState(Math.min(5, maxCount ?? 500));
  const [mode, setMode] = useState<RandomMode>('percentage');
  const [percentages, setPercentages] = useState<FieldPercentages>(() => initPercentages(fields));
  const [counts, setCounts] = useState<FieldCounts>(() => initCounts(fields, count));
  const [textAnswers, setTextAnswers] = useState<FieldTextAnswers>({});
  // Track which percentages/counts user manually set (by index)
  const [userSet, setUserSet] = useState<{ [entryId: string]: Set<number> }>({});

  // States for Groq AI Text Generation
  const [aiCounts, setAiCounts] = useState<{ [entryId: string]: number }>({});
  const [aiStyles, setAiStyles] = useState<{ [entryId: string]: string }>({});
  const [generatingFields, setGeneratingFields] = useState<{ [entryId: string]: boolean }>({});

  const handleAiCountChange = (entryId: string, value: number) => {
    setAiCounts(prev => ({ ...prev, [entryId]: value }));
  };

  const handleAiStyleChange = (entryId: string, value: string) => {
    setAiStyles(prev => ({ ...prev, [entryId]: value }));
  };

  const handleGenerateWithAI = async (field: FormField, groupCount?: number) => {
    const entryId = field.entryId;
    const reqCount = groupCount ?? count; // Dùng số lượng được truyền vào (theo nhánh) hoặc số lượng chung
    const reqStyle = aiStyles[entryId] || 'natural';

    let styleDesc = '';
    switch (reqStyle) {
      case 'natural':
        styleDesc = 'tự nhiên, ngắn gọn như một người dùng bình thường điền khảo sát, khoảng 1 câu hoặc vài từ, không dài dòng';
        break;
      case 'positive':
        styleDesc = 'tích cực, khen ngợi hết lời, rất hài lòng về sản phẩm/dịch vụ/nội dung được khảo sát';
        break;
      case 'detailed':
        styleDesc = 'chi tiết, đầy đủ ý, phân tích cụ thể, có lý luận rõ ràng, câu dài hơn';
        break;
      case 'constructive':
        styleDesc = 'góp ý xây dựng chân thành, chỉ ra những điểm còn chưa tốt một cách văn minh, đóng góp giúp cải thiện';
        break;
      case 'negative':
        styleDesc = 'chê, thẳng thắn phê bình, chỉ ra các điểm bất tiện, trải nghiệm không tốt, thiếu sót hoặc gây thất vọng';
        break;
      case 'balanced':
        styleDesc = 'vừa khen vừa chê, nêu bật được ưu điểm tốt và chỉ ra cả điểm hạn chế hoặc thiếu sót chưa tốt để ý kiến khách quan nhất';
        break;
      case 'mixed':
        styleDesc = 'trộn lẫn và kết hợp nhiều phong cách khác nhau ở trên (câu khen, câu chê, câu ngắn gọn, câu chi tiết, câu vừa khen vừa chê xen kẽ nhau)';
        break;
      default:
        styleDesc = 'tự nhiên và ngắn gọn';
    }

    const prompt = `Bạn là một người dùng thực tế đang điền khảo sát/form ý kiến.
Hãy viết ra đúng ${reqCount} câu trả lời mẫu khác nhau, đa dạng, cực kỳ tự nhiên cho câu hỏi khảo sát sau:
"${field.name}"

Yêu cầu phong cách: ${styleDesc}

QUAN TRỌNG:
- Chỉ trả về danh sách các câu trả lời mẫu, MỖI CÂU TRẢ LỜI LÀ MỘT DÒNG DUY NHẤT.
- Không đánh số thứ tự câu (không viết 1., 2., 3., a., b., c.).
- Không thêm bất kỳ văn bản giải thích, lời giới thiệu hay mở đầu/kết thúc nào.
- Trực tiếp đi vào danh sách câu trả lời mẫu.`;

    setGeneratingFields(prev => ({ ...prev, [entryId]: true }));
    try {
      const response = await generateWithGroq(prompt);
      const cleaned = cleanAIResponse(response, reqCount);

      if (cleaned.length === 0) {
        throw new Error('AI phản hồi không đúng cấu trúc yêu cầu.');
      }

      setTextAnswers(prev => {
        const existing = prev[entryId] || '';
        const lines = existing.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const newText = cleaned.join('\n');
        const mergedText = lines.length > 0 ? `${existing.trim()}\n${newText}` : newText;
        return { ...prev, [entryId]: mergedText };
      });

      toast({
        title: 'Tạo câu trả lời thành công',
        description: `Đã sinh thêm ${cleaned.length} câu trả lời mẫu tự luận bằng AI.`,
      });
    } catch (err: any) {
      toast({
        title: 'Lỗi sinh AI',
        description: err.message || 'Không thể gọi API Groq. Vui lòng kiểm tra lại key.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingFields(prev => ({ ...prev, [entryId]: false }));
    }
  };

  useEffect(() => {
    setPercentages(initPercentages(fields));
    
    // Compute dynamic counts based on generatorMode and branchConfig
    const c: FieldCounts = {};
    let totalBranchResponses = 0;
    if (branchConfig) {
      totalBranchResponses = branchConfig.branches.reduce((s, b) => s + b.count, 0);
    }

    for (const field of fields) {
      let expectedCount = count;
      if (generatorMode === 'branch' && branchConfig) {
        const branch = branchConfig.branches.find(b => b.fieldEntryIds.includes(field.entryId));
        if (branch) {
          expectedCount = branch.count;
        } else {
          expectedCount = totalBranchResponses; // Common fields or trigger field
        }
      }

      if ([2, 3, 4, 7].includes(field.type) && field.options && field.options.length > 0) {
        c[field.entryId] = randomDistributeCounts(expectedCount, field.options.length);
      } else if ([5, 18].includes(field.type)) {
        const min = field.scaleMin ?? 1;
        const max = field.scaleMax ?? 5;
        const optsCount = max - min + 1;
        c[field.entryId] = randomDistributeCounts(expectedCount, optsCount);
      }
    }
    setCounts(c);
    setUserSet({});
  }, [fields, count, generatorMode, branchConfig]);

  const handlePercentageChange = useCallback((entryId: string, index: number, value: string, optionCount: number) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0 || numVal > 100) return;

    // Update both states together to ensure consistency
    setUserSet(prev => {
      const newSet = new Set(prev[entryId] || []);
      newSet.add(index);
      const newState = { ...prev, [entryId]: newSet };

      // Now update percentages based on new userSet
      setPercentages(percsPrev => {
        const current = [...(percsPrev[entryId] || Array(optionCount).fill(0))];
        current[index] = numVal;

        // Get user-set indices from NEW state
        const manualIndices = new Set(newState[entryId] || []);
        manualIndices.add(index);

        const manualSum = Array.from(manualIndices).reduce((sum, i) => sum + (i === index ? numVal : current[i]), 0);
        const remaining = Math.max(0, 100 - manualSum);
        const autoIndices = Array.from({ length: optionCount }, (_, i) => i).filter(i => !manualIndices.has(i));

        if (autoIndices.length > 0) {
          const distributed = randomDistribute(remaining, autoIndices.length);
          autoIndices.forEach((ai, di) => {
            current[ai] = distributed[di];
          });
        }

        return { ...percsPrev, [entryId]: current };
      });

      return newState;
    });
  }, []);

  const handleCountChange = useCallback((entryId: string, index: number, value: string, optionCount: number, totalForField: number) => {
    const numVal = parseInt(value);
    if (isNaN(numVal) || numVal < 0 || numVal > totalForField) return;

    // Update both states together to ensure consistency
    setUserSet(prev => {
      const newSet = new Set(prev[entryId] || []);
      newSet.add(index);
      const newState = { ...prev, [entryId]: newSet };

      // Now update counts based on the new userSet
      setCounts(countsPrev => {
        const current = [...(countsPrev[entryId] || Array(optionCount).fill(0))];
        current[index] = numVal;

        // Get user-set indices from the NEW state
        const manualIndices = new Set(newState[entryId] || []);
        manualIndices.add(index);

        const manualSum = Array.from(manualIndices).reduce((sum, i) => sum + (i === index ? numVal : current[i]), 0);
        const remaining = Math.max(0, totalForField - manualSum);
        const autoIndices = Array.from({ length: optionCount }, (_, i) => i).filter(i => !manualIndices.has(i));

        if (autoIndices.length > 0) {
          const distributed = randomDistributeCounts(remaining, autoIndices.length);
          autoIndices.forEach((ai, di) => {
            current[ai] = distributed[di];
          });
        }

        return { ...countsPrev, [entryId]: current };
      });

      return newState;
    });
  }, []);

  const handleTextChange = (entryId: string, value: string) => {
    setTextAnswers(prev => ({ ...prev, [entryId]: value }));
  };

  const handleGenerateBranch = async () => {
    const totalBranchResponses = branchConfig!.branches.reduce((s, b) => s + b.count, 0);
    if (totalBranchResponses === 0) {
      toast({ title: 'Số lượng không hợp lệ', description: 'Cần có ít nhất 1 response cho 1 nhánh.', variant: 'destructive' });
      return;
    }
    if (maxCount !== undefined && totalBranchResponses > maxCount) {
      toast({ title: 'Vượt quá số lượt', description: `Bạn chỉ còn ${maxCount} lượt.`, variant: 'destructive' });
      return;
    }

    const responses: GeneratedResponse[] = [];
    const assignedFieldIds = new Set(branchConfig!.branches.flatMap(b => b.fieldEntryIds));
    const commonFields = fields.filter(
      f => f.entryId !== branchConfig!.triggerEntryId && !assignedFieldIds.has(f.entryId)
    );
    
    for (const branch of branchConfig!.branches) {
      for (let i = 0; i < branch.count; i++) {
        const resp: GeneratedResponse = { [branchConfig!.triggerEntryId]: branch.optionValue };

        // Populate common fields so questions before/after the branch trigger are not left blank.
        for (const field of commonFields) {
          if ([2, 3, 4, 7, 5, 18].includes(field.type)) {
            const options = field.options || (field.scaleMin !== undefined ? Array.from({length: field.scaleMax! - field.scaleMin! + 1}, (_, idx) => String(field.scaleMin! + idx)) : []);
            const dist = getDeterministicDistributionByCount(options, counts[field.entryId], totalBranchResponses);
            resp[field.entryId] = dist.length > 0 ? dist[responses.length % dist.length] : '';
          } else {
            const lines = (textAnswers[field.entryId] || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const fallback = ["Không có ý kiến", "Bình thường", "Tốt", ".", "Không", "Chưa có"];
            resp[field.entryId] = lines.length > 0 ? lines[responses.length % lines.length] : fallback[responses.length % fallback.length];
          }
        }
        
        // Populate fields in this branch
        const branchFields = fields.filter(f => branch.fieldEntryIds.includes(f.entryId));
        for (const field of branchFields) {
          if ([2, 3, 4, 7, 5, 18].includes(field.type)) {
            const options = field.options || (field.scaleMin !== undefined ? Array.from({length: field.scaleMax! - field.scaleMin! + 1}, (_, idx) => String(field.scaleMin! + idx)) : []);
            const dist = getDeterministicDistributionByCount(options, counts[field.entryId], branch.count);
            resp[field.entryId] = dist[i % dist.length];
          } else {
            const lines = (textAnswers[field.entryId] || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const fallback = ["Không có ý kiến", "Bình thường", "Tốt", ".", "Không", "Chưa có"];
            resp[field.entryId] = lines.length > 0 ? lines[i % lines.length] : fallback[i % fallback.length];
          }
        }
        responses.push(resp);
      }
    }
    onResponsesReady(shuffleArray(responses));
  };

  const handleGenerate = () => {
    if (maxCount !== undefined && count > maxCount) {
      toast({
        title: 'Vượt quá số lượt',
        description: `Bạn chỉ còn ${maxCount} lượt. Vui lòng giảm số lượng hoặc nạp thêm.`,
        variant: 'destructive',
      });
      return;
    }

    const fieldAllocations: { [entryId: string]: string[] } = {};

    for (const field of fields) {
      if ([2, 3, 4, 7].includes(field.type)) {
        if (field.options && field.options.length > 0) {
          let allocated: string[] = [];
          if (mode === 'percentage') {
            allocated = getDeterministicDistributionByPercentage(field.options, percentages[field.entryId], count);
          } else {
            allocated = getDeterministicDistributionByCount(field.options, counts[field.entryId], count);
          }
          fieldAllocations[field.entryId] = shuffleArray(allocated);
        }
      } else if ([5, 18].includes(field.type)) {
        const min = field.scaleMin ?? 1;
        const max = field.scaleMax ?? 5;
        const values = Array.from({ length: max - min + 1 }, (_, idx) => String(min + idx));
        let allocated: string[] = [];
        if (mode === 'percentage') {
          allocated = getDeterministicDistributionByPercentage(values, percentages[field.entryId], count);
        } else {
          allocated = getDeterministicDistributionByCount(values, counts[field.entryId], count);
        }
        fieldAllocations[field.entryId] = shuffleArray(allocated);
      }
    }

    let responses: GeneratedResponse[] = [];

    for (let i = 0; i < count; i++) {
      const resp: GeneratedResponse = {};

      for (const field of fields) {
        if ([2, 3, 4, 7, 5, 18].includes(field.type)) {
          const allocated = fieldAllocations[field.entryId];
          if (allocated && allocated.length > 0) {
            resp[field.entryId] = allocated[i % allocated.length];
          } else {
            resp[field.entryId] = '';
          }
        } else {
          const lines = (textAnswers[field.entryId] || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const fallback = ["Không có ý kiến", "Bình thường", "Tốt", ".", "Không", "Chưa có"];
          if (lines.length > 0) {
            resp[field.entryId] = lines[i % lines.length];
          } else {
            resp[field.entryId] = fallback[i % fallback.length];
          }
        }
      }

      responses.push(resp);
    }

    responses = shuffleArray(responses);

    onResponsesReady(responses);
    toast({
      title: 'Đã tạo xong',
      description: `Đã random ${responses.length} bộ câu trả lời theo ${mode === 'percentage' ? 'tỷ lệ %' : 'số lượng cụ thể'} (ngẫu nhiên)`,
    });
  };

  const defaultPageBreakMap = pageBreakMap ?? new Map<number, string>([[0, 'Phần 1']]);
  const totalBranchResponses = branchConfig ? branchConfig.branches.reduce((s, b) => s + b.count, 0) : 0;

  const renderFieldGroup = (title: string, groupFields: FormField[], totalForGroup: number, currentMode: RandomMode) => {
    const choiceF = groupFields.filter(f => [2, 3, 4].includes(f.type) && f.options && f.options.length > 0);
    const scaleF = groupFields.filter(f => [5, 18].includes(f.type));
    const gridF = groupFields.filter(f => f.type === 7 && f.options && f.options.length > 0);
    const textF = groupFields.filter(f => [0, 1].includes(f.type));

    if (!choiceF.length && !scaleF.length && !gridF.length && !textF.length) return null;

    return (
      <div className="space-y-5 mt-6 pt-5 border-t border-border/50 relative">
        <div className="absolute -top-3 left-2 px-3 py-0.5 bg-background border border-border/50 rounded-full text-xs font-bold text-violet-600 dark:text-violet-400 shadow-sm">
          {title} <span className="text-muted-foreground font-normal ml-1">({totalForGroup} lượt)</span>
        </div>
        
        {choiceF.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {currentMode === 'percentage' ? <Percent className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
              <Label className="text-sm font-semibold">
                {currentMode === 'percentage' ? 'Tỷ lệ đáp án trắc nghiệm' : 'Số lượng đáp án trắc nghiệm'}
              </Label>
            </div>
            {choiceF.map(field => (
              <PercentageField
                key={field.entryId}
                field={field}
                values={currentMode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
                onChange={(idx, val) => currentMode === 'percentage' 
                  ? handlePercentageChange(field.entryId, idx, val, field.options!.length)
                  : handleCountChange(field.entryId, idx, val, field.options!.length, totalForGroup)
                }
                mode={currentMode}
                totalCount={totalForGroup}
              />
            ))}
          </div>
        )}

        {scaleF.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {currentMode === 'percentage' ? <Percent className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
              <Label className="text-sm font-semibold">
                {currentMode === 'percentage' ? 'Tỷ lệ thang đo' : 'Số lượng thang đo'}
              </Label>
            </div>
            {scaleF.map(field => {
              const min = field.scaleMin ?? 1;
              const max = field.scaleMax ?? 5;
              const scaleOptions = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
              return (
                <PercentageField
                  key={field.entryId}
                  field={{ ...field, options: scaleOptions }}
                  values={currentMode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
                  onChange={(idx, val) => currentMode === 'percentage'
                    ? handlePercentageChange(field.entryId, idx, val, scaleOptions.length)
                    : handleCountChange(field.entryId, idx, val, scaleOptions.length, totalForGroup)
                  }
                  mode={currentMode}
                  totalCount={totalForGroup}
                />
              );
            })}
          </div>
        )}

        {gridF.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {currentMode === 'percentage' ? <Percent className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
              <Label className="text-sm font-semibold">
                {currentMode === 'percentage' ? 'Tỷ lệ đáp án lưới' : 'Số lượng đáp án lưới'}
              </Label>
            </div>
            {gridF.map(field => (
              <PercentageField
                key={field.entryId}
                field={field}
                values={currentMode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
                onChange={(idx, val) => currentMode === 'percentage'
                  ? handlePercentageChange(field.entryId, idx, val, field.options!.length)
                  : handleCountChange(field.entryId, idx, val, field.options!.length, totalForGroup)
                }
                mode={currentMode}
                totalCount={totalForGroup}
              />
            ))}
          </div>
        )}

        {textF.length > 0 && (
          <div className="space-y-5">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-purple-500 animate-pulse" />
              Câu trả lời tự luận (mỗi dòng = 1 câu trả lời mẫu)
            </Label>
            {textF.map(field => (
              <div key={field.entryId} className="space-y-2 border border-border/50 bg-muted/10 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-bold text-foreground truncate max-w-[85%]">{field.name}</p>
                  <span className="text-[10px] bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded-full border border-border/40">
                    {field.entryId}
                  </span>
                </div>
                
                <Textarea
                  placeholder={`Nhập mỗi dòng 1 câu trả lời mẫu...`}
                  value={textAnswers[field.entryId] || ''}
                  onChange={(e) => handleTextChange(field.entryId, e.target.value)}
                  className="min-h-[100px] bg-background/80 border-2 border-transparent focus:border-accent rounded-xl text-sm"
                  rows={4}
                />

                <div className="p-3.5 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 space-y-3 mt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-700 dark:text-purple-400">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse animate-duration-1000" />
                      Tích hợp AI Groq (Miễn phí)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">Số câu cần gen</Label>
                      <div className="h-8 flex items-center justify-center text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 rounded-lg px-2 text-center truncate">
                        ✨ {totalForGroup} câu
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[11px] font-bold text-muted-foreground">Phong cách viết</Label>
                      <select
                        value={aiStyles[field.entryId] || 'natural'}
                        onChange={(e) => handleAiStyleChange(field.entryId, e.target.value)}
                        className="w-full h-8 text-xs bg-background/80 border border-input rounded-lg px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="natural">🍃 Tự nhiên & Ngắn gọn</option>
                        <option value="positive">😍 Tích cực & Khen ngợi</option>
                        <option value="detailed">📝 Chi tiết & Đầy đủ</option>
                        <option value="constructive">💡 Góp ý xây dựng</option>
                        <option value="negative">👎 Chê & Thẳng thắn phê bình</option>
                        <option value="balanced">☯️ Vừa khen vừa chê</option>
                        <option value="mixed">🔀 Trộn lẫn phong cách</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    size="sm"
                    disabled={generatingFields[field.entryId]}
                    onClick={() => handleGenerateWithAI(field, totalForGroup)}
                    className="w-full h-8 text-xs font-bold gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {generatingFields[field.entryId] ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tạo câu trả lời mẫu...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Tạo {totalForGroup} câu trả lời bằng AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ---- Generator mode tab ---- */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/40 border border-border/50">
        <button
          type="button"
          id="generator-mode-full"
          onClick={() => setGeneratorMode('full')}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
            generatorMode === 'full'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutList className="h-4 w-4" />
          Random toàn bộ
        </button>
        <button
          type="button"
          id="generator-mode-branch"
          onClick={() => setGeneratorMode('branch')}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
            generatorMode === 'branch'
              ? 'bg-violet-600 shadow-sm text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Random phân nhánh
        </button>
      </div>

      {/* ---- FULL mode header ---- */}
      {generatorMode === 'full' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Shuffle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Random theo {mode === 'percentage' ? 'tỷ lệ' : 'số lượng'}</h3>
              <p className="text-sm text-muted-foreground">
                {mode === 'percentage'
                  ? 'Phân bổ tỷ lệ % cho từng đáp án, tổng luôn = 100%'
                  : 'Phân bổ số lượng cụ thể cho từng đáp án, tổng luôn = số response'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- BRANCH mode panel ---- */}
      {generatorMode === 'branch' && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-violet-500" />
            <h3 className="text-base font-bold text-violet-700 dark:text-violet-300">Cấu hình phân nhánh</h3>
          </div>
          <BranchConfigPanel
            fields={fields}
            pageBreakMap={defaultPageBreakMap}
            value={branchConfig ?? null}
            onChange={(val) => setBranchConfig(val ?? undefined)}
          />
        </div>
      )}

      {/* Mode Selection and Count - conditional by generator mode */}
      {generatorMode === 'full' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Chế độ random</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as RandomMode)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                  <Percent className="h-4 w-4" />
                  Theo tỷ lệ %
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Theo số lượng
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Số lượng response</Label>
            <Input
              type="number"
              min={1}
              max={maxCount ?? 500}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, maxCount ?? 500)))}
              className="h-11 bg-muted/50 border-2 border-transparent focus:border-accent rounded-xl max-w-[200px]"
            />
            {maxCount !== undefined && (
              <p className="text-xs text-muted-foreground">Tối đa <span className="font-bold text-primary">{maxCount}</span> lượt (số dư hiện tại)</p>
            )}
          </div>
        </>
      )}

      {/* Dynamic fields rendering */}
      {generatorMode === 'full' ? (
        renderFieldGroup("Tất cả câu hỏi", fields, count, mode)
      ) : branchConfig ? (
        <div className="space-y-4 mt-6">
          {renderFieldGroup("Câu hỏi chung", fields.filter(f => f.entryId !== branchConfig.triggerEntryId && !branchConfig.branches.some(b => b.fieldEntryIds.includes(f.entryId))), totalBranchResponses, 'count')}
          {branchConfig.branches.map(b => (
            <div key={b.optionValue}>
              {renderFieldGroup(`Nhánh: ${b.optionValue}`, fields.filter(f => b.fieldEntryIds.includes(f.entryId)), b.count, 'count')}
            </div>
          ))}
        </div>
      ) : null}

      {generatorMode === 'full' ? (
        <Button
          id="generate-responses-btn"
          onClick={handleGenerate}
          className="w-full h-12 gap-2 rounded-xl bg-accent text-accent-foreground font-bold hover:opacity-90 transition-all shadow-lg"
        >
          <Play className="h-4 w-4" />
          Random {count} bộ câu trả lời
        </Button>
      ) : (
        <Button
          id="generate-branch-btn"
          onClick={handleGenerateBranch}
          className="w-full h-12 gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg shadow-violet-600/20"
        >
          <GitBranch className="h-4 w-4" />
          Random {totalBranchResponses} bộ câu trả lời (phân nhánh)
        </Button>
      )}
    </div>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDeterministicDistributionByCount(options: string[], counts: number[] | undefined, total: number): string[] {
  if (!counts || counts.length !== options.length) {
    return Array.from({ length: total }, (_, i) => options[i % options.length]);
  }
  const distributed: string[] = [];
  counts.forEach((count, optionIndex) => {
    for (let i = 0; i < count; i++) {
      distributed.push(options[optionIndex]);
    }
  });
  while (distributed.length < total) {
    distributed.push(options[Math.floor(Math.random() * options.length)]);
  }
  return distributed.slice(0, total);
}

function getDeterministicDistributionByPercentage(options: string[], percentages: number[] | undefined, total: number): string[] {
  if (!percentages || percentages.length !== options.length) {
    return Array.from({ length: total }, (_, i) => options[i % options.length]);
  }
  const counts = percentages.map(p => Math.round((p / 100) * total));
  const distributed: string[] = [];
  counts.forEach((count, optionIndex) => {
    for (let i = 0; i < count; i++) {
      distributed.push(options[optionIndex]);
    }
  });
  while (distributed.length < total) {
    distributed.push(options[Math.floor(Math.random() * options.length)]);
  }
  return distributed.slice(0, total);
}

function weightedPick(options: string[], weights: number[] | undefined): string {
  if (!weights || weights.length !== options.length) {
    return options[Math.floor(Math.random() * options.length)];
  }
  const r = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < options.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return options[i];
  }
  return options[options.length - 1];
}

function weightedPickByCount(options: string[], counts: number[] | undefined): string {
  if (!counts || counts.length !== options.length) {
    return options[Math.floor(Math.random() * options.length)];
  }
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
  const r = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < options.length; i++) {
    cumulative += counts[i];
    if (r <= cumulative) return options[i];
  }
  return options[options.length - 1];
}

function PercentageField({
  field,
  values,
  onChange,
  mode,
  totalCount,
}: {
  field: FormField & { options?: string[] };
  values: number[];
  onChange: (index: number, value: string) => void;
  mode: RandomMode;
  totalCount: number;
}) {
  const total = values.reduce((a, b) => a + b, 0);
  const expectedTotal = mode === 'percentage' ? 100 : totalCount;
  const totalRounded = Math.round(total * 100) / 100;

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium truncate max-w-[70%]">{field.name}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          Math.abs(totalRounded - expectedTotal) < (mode === 'percentage' ? 0.1 : 0.1)
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          Tổng: {totalRounded} {mode === 'percentage' ? '%' : ''}
        </span>
      </div>
      <div className="grid gap-2">
        {(field.options || []).map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex-1 truncate">{opt}</span>
            <div className="flex items-center gap-1 w-24">
              <Input
                type="number"
                step={mode === 'percentage' ? '0.01' : '1'}
                min={0}
                max={mode === 'percentage' ? 100 : totalCount}
                value={values[idx] ?? 0}
                onChange={(e) => onChange(idx, e.target.value)}
                className="h-8 text-xs text-right bg-background/80 border border-border/50 rounded-lg px-2"
              />
              <span className="text-xs text-muted-foreground">
                {mode === 'percentage' ? '%' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
      {mode === 'count' && (
        <p className="text-xs text-muted-foreground">
          Còn lại: {Math.max(0, totalCount - total)} / {totalCount} responses
        </p>
      )}
    </div>
  );
}
