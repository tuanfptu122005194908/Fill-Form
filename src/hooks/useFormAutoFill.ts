import { useState, useRef, useCallback } from 'react';
import { FormField, GeneratedResponse, SubmitStatus } from '@/types/form';
import { parseFormHtml, getSubmitUrl } from '@/lib/formParser';
import { submitFormResponse, sleep } from '@/lib/formSubmitter';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useFormAutoFill() {
  const [formUrl, setFormUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [delayMs, setDelayMs] = useState(1500);
  const [generatedResponses, setGeneratedResponses] = useState<GeneratedResponse[]>([]);
  const [status, setStatus] = useState<SubmitStatus>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentIndexRef = useRef(0);
  const successCountRef = useRef(0);

  const [isFetching, setIsFetching] = useState(false);

  const analyzeForm = useCallback(async () => {
    if (!formUrl.trim()) {
      toast({
        title: 'Thiếu dữ liệu',
        description: 'Vui lòng dán link Google Form',
        variant: 'destructive',
      });
      return;
    }

    if (!formUrl.includes('docs.google.com/forms')) {
      toast({
        title: 'URL không hợp lệ',
        description: 'Vui lòng nhập link Google Form hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    setIsFetching(true);
    try {
      // Fetch HTML from edge function proxy
      const { data, error } = await supabase.functions.invoke('fetch-form', {
        body: { url: formUrl },
      });

      if (error || data?.error) {
        toast({
          title: 'Lỗi tải form',
          description: data?.error || error?.message || 'Không thể tải form',
          variant: 'destructive',
        });
        setIsFetching(false);
        return;
      }

      const htmlContent = data.html;
      setHtmlSource(htmlContent);

      const result = parseFormHtml(htmlContent);
      
      if (result.fields.length === 0) {
        toast({
          title: 'Không tìm thấy câu hỏi',
          description: 'Không thể phân tích được câu hỏi từ form.',
          variant: 'destructive',
        });
        setIsFetching(false);
        return;
      }

      setFields(result.fields);
      setPageCount(result.pageCount);
      setGeneratedResponses([]);
      
      toast({
        title: 'Phân tích thành công',
        description: `Đã tìm thấy ${result.fields.length} câu hỏi (${result.pageCount} trang)`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi phân tích',
        description: error instanceof Error ? error.message : 'Lỗi không xác định',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [formUrl]);

  // Submit with per-form credit deduction and pause/resume support
  const startSubmitting = useCallback(async (userId?: number) => {
    if (!formUrl.includes('docs.google.com/forms')) {
      toast({
        title: 'URL không hợp lệ',
        description: 'Vui lòng nhập link Google Form hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    if (generatedResponses.length === 0) {
      toast({
        title: 'Chưa có câu trả lời',
        description: 'Vui lòng tạo câu trả lời trước khi gửi',
        variant: 'destructive',
      });
      return;
    }

    const submitUrl = getSubmitUrl(formUrl);
    const total = generatedResponses.length;
    const startIdx = currentIndexRef.current;

    // If resuming
    if (isPausedRef.current) {
      isPausedRef.current = false;
    }
    
    isRunningRef.current = true;

    setStatus({ current: startIdx, total, status: 'submitting', message: `Đang gửi ${startIdx + 1}/${total}...` });

    for (let i = startIdx; i < total && isRunningRef.current; i++) {
      // Check if paused
      if (isPausedRef.current) {
        currentIndexRef.current = i;
        setStatus({ current: i, total, status: 'paused', message: `Tạm dừng tại ${i}/${total} (đã gửi ${successCountRef.current} form)` });
        isRunningRef.current = false;
        return;
      }

      try {
        setStatus({ current: i, total, status: 'submitting', message: `Đang gửi ${i + 1}/${total}...` });

        // Deduct 1 credit before each submission
        if (userId) {
          const { data } = await supabase.functions.invoke('wallet', {
            body: { action: 'use_form_single', user_id: userId, form_url: formUrl, count: 1 },
          });
          if (data?.error) {
            setStatus({ current: i, total, status: 'error', message: `Hết lượt tại form ${i + 1}` });
            toast({ title: 'Hết lượt', description: data.error, variant: 'destructive' });
            currentIndexRef.current = i;
            isRunningRef.current = false;
            return;
          }
        }
        
        await submitFormResponse(submitUrl, generatedResponses[i], fields, pageCount);
        successCountRef.current++;
        
        setStatus({ current: i + 1, total, status: 'submitting', message: `Đã gửi ${i + 1}/${total}` });

        if (i < total - 1 && isRunningRef.current && !isPausedRef.current) {
          await sleep(delayMs);
        }
      } catch (error) {
        console.error(`Error submitting response ${i + 1}:`, error);
        setStatus({
          current: i,
          total,
          status: 'error',
          message: `Lỗi tại lần gửi ${i + 1}`,
        });
        currentIndexRef.current = i;
        isRunningRef.current = false;
        return;
      }
    }

    if (isRunningRef.current) {
      // Log aggregate history
      if (userId && successCountRef.current > 0) {
        await supabase.functions.invoke('wallet', {
          body: { action: 'log_batch_history', user_id: userId, form_url: formUrl, count: successCountRef.current },
        });
      }

      setStatus({ current: total, total, status: 'completed', message: `Hoàn thành! Đã gửi ${successCountRef.current} form` });
      toast({
        title: 'Hoàn thành',
        description: `Đã gửi thành công ${successCountRef.current} form`,
      });
    }

    isRunningRef.current = false;
  }, [formUrl, generatedResponses, delayMs, fields, pageCount]);

  const pauseSubmitting = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeSubmitting = useCallback((userId?: number) => {
    if (isPausedRef.current || status.status === 'paused') {
      startSubmitting(userId);
    }
  }, [startSubmitting, status.status]);

  const stopSubmitting = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    setStatus((prev) => ({
      ...prev,
      status: 'paused',
      message: `Đã dừng tại ${prev.current}/${prev.total} (đã gửi ${successCountRef.current} form)`,
    }));
  }, []);

  const reset = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    currentIndexRef.current = 0;
    successCountRef.current = 0;
    setFields([]);
    setPageCount(1);
    setGeneratedResponses([]);
    setStatus({ current: 0, total: 0, status: 'idle' });
  }, []);

  return {
    formUrl,
    setFormUrl,
    htmlSource,
    setHtmlSource,
    fields,
    delayMs,
    setDelayMs,
    generatedResponses,
    setGeneratedResponses,
    status,
    isFetching,
    analyzeForm,
    startSubmitting,
    pauseSubmitting,
    resumeSubmitting,
    stopSubmitting,
    reset,
  };
}
