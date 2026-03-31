import { useState, useEffect, useCallback } from 'react';
import { Shuffle, Play, Percent, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, GeneratedResponse } from '@/types/form';
import { toast } from '@/hooks/use-toast';

interface RandomResponseGeneratorProps {
  fields: FormField[];
  onResponsesReady: (responses: GeneratedResponse[]) => void;
  maxCount?: number;
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

export function RandomResponseGenerator({ fields, onResponsesReady, maxCount }: RandomResponseGeneratorProps) {
  const [count, setCount] = useState(Math.min(5, maxCount ?? 500));
  const [mode, setMode] = useState<RandomMode>('percentage');
  const [percentages, setPercentages] = useState<FieldPercentages>(() => initPercentages(fields));
  const [counts, setCounts] = useState<FieldCounts>(() => initCounts(fields, count));
  const [textAnswers, setTextAnswers] = useState<FieldTextAnswers>({});
  // Track which percentages/counts user manually set (by index)
  const [userSet, setUserSet] = useState<{ [entryId: string]: Set<number> }>({});

  useEffect(() => {
    setPercentages(initPercentages(fields));
    setCounts(initCounts(fields, count));
    setUserSet({});
  }, [fields, count]);

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

  const handleCountChange = useCallback((entryId: string, index: number, value: string, optionCount: number) => {
    const numVal = parseInt(value);
    if (isNaN(numVal) || numVal < 0 || numVal > count) return;

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
        const remaining = Math.max(0, count - manualSum);
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
  }, [count]);

  const handleTextChange = (entryId: string, value: string) => {
    setTextAnswers(prev => ({ ...prev, [entryId]: value }));
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

    const responses: GeneratedResponse[] = [];

    for (let i = 0; i < count; i++) {
      const resp: GeneratedResponse = {};

      for (const field of fields) {
        if ([2, 3, 4, 7].includes(field.type)) {
          // Radio / Dropdown / Checkbox / Grid row - pick one based on percentages or counts
          if (field.options && field.options.length > 0) {
            if (mode === 'percentage') {
              // Use deterministic pick for exact percentage distribution
              resp[field.entryId] = deterministicPickByPercentage(field.options, percentages[field.entryId], i, count);
            } else {
              // Use deterministic pick for exact count distribution
              resp[field.entryId] = deterministicPickByCount(field.options, counts[field.entryId], i, count);
            }
          }
        } else if ([5, 18].includes(field.type)) {
          // Scale / Star rating
          const min = field.scaleMin ?? 1;
          const max = field.scaleMax ?? 5;
          const values = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
          if (mode === 'percentage') {
            // Use deterministic pick for exact percentage distribution
            resp[field.entryId] = deterministicPickByPercentage(values, percentages[field.entryId], i, count);
          } else {
            // Use deterministic pick for exact count distribution
            resp[field.entryId] = deterministicPickByCount(values, counts[field.entryId], i, count);
          }
        } else {
          // Text fields - pick from user lines or empty
          const lines = (textAnswers[field.entryId] || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length > 0) {
            resp[field.entryId] = lines[Math.floor(Math.random() * lines.length)];
          } else {
            resp[field.entryId] = '';
          }
        }
      }

      responses.push(resp);
    }

    onResponsesReady(responses);
    toast({
      title: 'Đã tạo xong',
      description: `Đã random ${responses.length} bộ câu trả lời theo ${mode === 'percentage' ? 'tỷ lệ %' : 'số lượng cụ thể'} (chính xác)`,
    });
  };

  const choiceFields = fields.filter(f => [2, 3, 4].includes(f.type) && f.options && f.options.length > 0);
  const gridFields = fields.filter(f => f.type === 7 && f.options && f.options.length > 0);
  const scaleFields = fields.filter(f => [5, 18].includes(f.type));
  const textFields = fields.filter(f => [0, 1].includes(f.type));

  return (
    <div className="space-y-6">
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

      {/* Mode Selection */}
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

      {/* Choice fields with percentage/count inputs */}
      {choiceFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {mode === 'percentage' ? (
              <Percent className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
            <Label className="text-sm font-semibold">
              {mode === 'percentage' ? 'Tỷ lệ đáp án trắc nghiệm' : 'Số lượng đáp án trắc nghiệm'}
            </Label>
          </div>
          {choiceFields.map(field => (
            <PercentageField
              key={field.entryId}
              field={field}
              values={mode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
              onChange={(idx, val) => mode === 'percentage' 
                ? handlePercentageChange(field.entryId, idx, val, field.options!.length)
                : handleCountChange(field.entryId, idx, val, field.options!.length)
              }
              mode={mode}
              totalCount={count}
            />
          ))}
        </div>
      )}

      {/* Scale fields with percentage/count inputs */}
      {scaleFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {mode === 'percentage' ? (
              <Percent className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
            <Label className="text-sm font-semibold">
              {mode === 'percentage' ? 'Tỷ lệ thang đo' : 'Số lượng thang đo'}
            </Label>
          </div>
          {scaleFields.map(field => {
            const min = field.scaleMin ?? 1;
            const max = field.scaleMax ?? 5;
            const scaleOptions = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
            return (
              <PercentageField
                key={field.entryId}
                field={{ ...field, options: scaleOptions }}
                values={mode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
                onChange={(idx, val) => mode === 'percentage'
                  ? handlePercentageChange(field.entryId, idx, val, scaleOptions.length)
                  : handleCountChange(field.entryId, idx, val, scaleOptions.length)
                }
                mode={mode}
                totalCount={count}
              />
            );
          })}
        </div>
      )}

      {/* Grid fields with percentage/count inputs */}
      {gridFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {mode === 'percentage' ? (
              <Percent className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
            <Label className="text-sm font-semibold">
              {mode === 'percentage' ? 'Tỷ lệ đáp án lưới' : 'Số lượng đáp án lưới'}
            </Label>
          </div>
          {gridFields.map(field => (
            <PercentageField
              key={field.entryId}
              field={field}
              values={mode === 'percentage' ? (percentages[field.entryId] || []) : (counts[field.entryId] || [])}
              onChange={(idx, val) => mode === 'percentage'
                ? handlePercentageChange(field.entryId, idx, val, field.options!.length)
                : handleCountChange(field.entryId, idx, val, field.options!.length)
              }
              mode={mode}
              totalCount={count}
            />
          ))}
        </div>
      )}

      {textFields.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Câu trả lời tự luận (mỗi dòng = 1 câu trả lời mẫu)</Label>
          {textFields.map(field => (
            <div key={field.entryId} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{field.name}</p>
              <Textarea
                placeholder={`Nhập mỗi dòng 1 câu trả lời mẫu...\nVí dụ:\nRất hay\nTuyệt vời\nTốt lắm`}
                value={textAnswers[field.entryId] || ''}
                onChange={(e) => handleTextChange(field.entryId, e.target.value)}
                className="min-h-[80px] bg-muted/50 border-2 border-transparent focus:border-accent rounded-xl text-sm"
                rows={3}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        className="w-full h-12 gap-2 rounded-xl bg-accent text-accent-foreground font-bold hover:opacity-90 transition-all shadow-lg"
      >
        <Play className="h-4 w-4" />
        Random {count} bộ câu trả lời
      </Button>
    </div>
  );
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

function deterministicPickByCount(options: string[], counts: number[] | undefined, index: number, total: number): string {
  if (!counts || counts.length !== options.length) {
    return options[index % options.length];
  }
  
  // Create array with exact distribution
  const distributed: string[] = [];
  counts.forEach((count, optionIndex) => {
    for (let i = 0; i < count; i++) {
      distributed.push(options[optionIndex]);
    }
  });
  
  // Pick by index modulo total
  if (distributed.length === 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  return distributed[index % distributed.length];
}

function deterministicPickByPercentage(options: string[], percentages: number[] | undefined, index: number, total: number): string {
  if (!percentages || percentages.length !== options.length) {
    return options[index % options.length];
  }
  
  // Convert percentages to counts (scaled to total)
  const counts = percentages.map(p => Math.round((p / 100) * total));
  
  // Create array with exact distribution
  const distributed: string[] = [];
  counts.forEach((count, optionIndex) => {
    for (let i = 0; i < count; i++) {
      distributed.push(options[optionIndex]);
    }
  });
  
  // Pick by index modulo total
  if (distributed.length === 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  return distributed[index % distributed.length];
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
