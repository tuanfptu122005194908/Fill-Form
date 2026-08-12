import { useState, useEffect } from 'react';
import { GitBranch, ChevronDown, ChevronUp, Percent, AlertTriangle, CheckCircle2, Layers, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, BranchConfig, BranchOption } from '@/types/form';
import { Badge } from '@/components/ui/badge';

interface BranchConfigProps {
  fields: FormField[];
  pageBreakMap: Map<number, string>;
  value: BranchConfig | null;
  onChange: (config: BranchConfig | null) => void;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function getTriggerFields(fields: FormField[]): FormField[] {
  return fields.filter(f => [2, 3].includes(f.type) && f.options && f.options.length > 1);
}

function getFieldsByPage(fields: FormField[]): Map<number, FormField[]> {
  const map = new Map<number, FormField[]>();
  for (const f of fields) {
    const pi = f.pageIndex ?? 0;
    if (!map.has(pi)) map.set(pi, []);
    map.get(pi)!.push(f);
  }
  return map;
}

function buildAutoConfig(trigger: FormField, fields: FormField[], pageBreakMap: Map<number, string>): BranchConfig {
  const triggerPage = trigger.pageIndex ?? 0;
  const branchPages = Array.from(pageBreakMap.keys())
    .filter(p => p > triggerPage)
    .sort((a, b) => a - b);

  const fieldsByPage = getFieldsByPage(fields);
  const options = trigger.options || [];

  const branches: BranchOption[] = options.map((opt, idx) => {
    const pageIdx = branchPages[idx];
    const pageFields = pageIdx !== undefined ? (fieldsByPage.get(pageIdx) || []) : [];
    return {
      optionValue: opt,
      count: 10, // Default to 10 responses per branch
      fieldEntryIds: pageFields.map(f => f.entryId),
    };
  });

  return { triggerEntryId: trigger.entryId, branches };
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function BranchConfigPanel({ fields, pageBreakMap, value, onChange }: BranchConfigProps) {
  const triggerFields = getTriggerFields(fields);
  const [selectedTriggerEntryId, setSelectedTriggerEntryId] = useState<string>(
    value?.triggerEntryId || triggerFields[0]?.entryId || ''
  );
  const [expandedBranch, setExpandedBranch] = useState<number | null>(0);
  const [configMode, setConfigMode] = useState<'auto' | 'manual'>('auto');

  const selectedTrigger = fields.find(f => f.entryId === selectedTriggerEntryId) || triggerFields[0];

  useEffect(() => {
    if (!selectedTrigger) return;
    if (value && value.triggerEntryId === selectedTrigger.entryId) return;
    const auto = buildAutoConfig(selectedTrigger, fields, pageBreakMap);
    onChange(auto);
  }, [selectedTrigger?.entryId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedTrigger || triggerFields.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-dashed border-amber-400/40 bg-amber-400/5 text-center space-y-2">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          Không tìm thấy câu hỏi trắc nghiệm/dropdown để làm câu phân nhánh
        </p>
        <p className="text-xs text-muted-foreground">
          Form cần có ít nhất 1 câu hỏi loại Trắc nghiệm hoặc Dropdown
        </p>
      </div>
    );
  }

  const config = value || buildAutoConfig(selectedTrigger, fields, pageBreakMap);

  const handleCountChange = (idx: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    const newBranches = config.branches.map((b, i) => i === idx ? { ...b, count: num } : b);
    onChange({ ...config, branches: newBranches });
  };

  const handleToggleField = (branchIdx: number, entryId: string) => {
    const newBranches = config.branches.map((b, i) => {
      if (i !== branchIdx) return b;
      const has = b.fieldEntryIds.includes(entryId);
      return {
        ...b,
        fieldEntryIds: has
          ? b.fieldEntryIds.filter(e => e !== entryId)
          : [...b.fieldEntryIds, entryId],
      };
    });
    onChange({ ...config, branches: newBranches });
  };

  const handleAutoAssign = () => {
    if (!selectedTrigger) return;
    onChange(buildAutoConfig(selectedTrigger, fields, pageBreakMap));
  };

  const totalCount = config.branches.reduce((s, b) => s + b.count, 0);
  const isValid = totalCount > 0;

  const branchableFields = fields.filter(
    f => f.entryId !== selectedTrigger.entryId && (f.pageIndex ?? 0) > (selectedTrigger.pageIndex ?? 0)
  );

  return (
    <div className="space-y-5">
      {/* Trigger field selector */}
      <div className="space-y-2">
        <Label className="text-sm font-bold flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-violet-500" />
          Câu hỏi phân nhánh (trigger)
        </Label>
        <div className="grid gap-2">
          {triggerFields.map(tf => (
            <button
              key={tf.entryId}
              type="button"
              onClick={() => {
                setSelectedTriggerEntryId(tf.entryId);
                onChange(buildAutoConfig(tf, fields, pageBreakMap));
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedTriggerEntryId === tf.entryId
                  ? 'border-violet-500 bg-violet-500/10 shadow-sm'
                  : 'border-border/50 bg-muted/20 hover:border-violet-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedTriggerEntryId === tf.entryId ? 'border-violet-500' : 'border-muted-foreground'
              }`}>
                {selectedTriggerEntryId === tf.entryId && (
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{tf.name}</p>
                <p className="text-xs text-muted-foreground">{tf.typeLabel} • {tf.options?.length} lựa chọn</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                Trang {(tf.pageIndex ?? 0) + 1}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfigMode('auto')}
          className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
            configMode === 'auto'
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'border-border/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Tự động theo Section
        </button>
        <button
          type="button"
          onClick={() => setConfigMode('manual')}
          className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
            configMode === 'manual'
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'border-border/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Thủ công
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Reset tự động"
          onClick={handleAutoAssign}
          className="h-9 px-3 rounded-xl text-xs border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Total count indicator */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${
        isValid
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
      }`}>
        <div className="flex items-center gap-1.5">
          {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          Tổng số lượng tạo ra: {totalCount} response
        </div>
        <span>{isValid ? 'Hợp lệ ✓' : 'Cần ít nhất 1 response'}</span>
      </div>

      {/* Branch list */}
      <div className="space-y-3">
        {config.branches.map((branch, idx) => (
          <div
            key={`${branch.optionValue}-${idx}`}
            className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden"
          >
            {/* Branch header */}
            <button
              type="button"
              onClick={() => setExpandedBranch(expandedBranch === idx ? null : idx)}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{branch.optionValue}</p>
                <p className="text-xs text-muted-foreground">
                  {branch.fieldEntryIds.length} câu hỏi được gán
                </p>
              </div>
              {/* Count input */}
              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <Input
                  type="number"
                  min={0}
                  value={branch.count}
                  onChange={e => handleCountChange(idx, e.target.value)}
                  className="h-8 w-20 text-xs text-right bg-background/80 border border-border/50 rounded-lg px-2 font-bold"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">lượt</span>
              </div>
              {expandedBranch === idx
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              }
            </button>

            {/* Branch body */}
            {expandedBranch === idx && (
              <div className="border-t border-border/30 p-4 space-y-3">
                {configMode === 'auto' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Câu hỏi đã tự động gán theo Section:
                    </p>
                    {branchableFields.length === 0 ? (
                      <p className="text-xs text-amber-500">Không có câu hỏi ở các trang sau trigger</p>
                    ) : (
                      <div className="space-y-1.5">
                        {branchableFields.map(f => {
                          const isAssigned = branch.fieldEntryIds.includes(f.entryId);
                          return (
                            <div
                              key={f.entryId}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                isAssigned
                                  ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                  : 'bg-muted/30 text-muted-foreground'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAssigned ? 'bg-violet-500' : 'bg-muted-foreground/30'}`} />
                              <span className="flex-1 truncate">{f.name}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                                T{(f.pageIndex ?? 0) + 1}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-2">
                      💡 Chuyển sang chế độ <strong>Thủ công</strong> để thay đổi phân công câu hỏi
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Chọn câu hỏi thuộc nhánh này:
                    </p>
                    {branchableFields.length === 0 ? (
                      <p className="text-xs text-amber-500">Không có câu hỏi ở các trang sau trigger</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                        {branchableFields.map(f => {
                          const isChecked = branch.fieldEntryIds.includes(f.entryId);
                          return (
                            <label
                              key={f.entryId}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors hover:bg-muted/50 ${
                                isChecked ? 'bg-violet-500/10' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleField(idx, f.entryId)}
                                className="rounded accent-violet-600"
                              />
                              <span className={`flex-1 truncate ${isChecked ? 'text-violet-700 dark:text-violet-300 font-medium' : 'text-foreground'}`}>
                                {f.name}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono flex-shrink-0">
                                T{(f.pageIndex ?? 0) + 1}
                              </Badge>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
