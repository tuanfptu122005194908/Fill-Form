import { useEffect, useState } from 'react';
import { Clock, Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusMap: Record<string, { label: string; cls: string }> = {
  success: { label: 'Thành công', cls: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Thất bại', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  blocked: { label: 'Hết lượt', cls: 'bg-warning/10 text-warning border-warning/20' },
};

export default function FormHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadHistory(); }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('wallet', {
      body: { action: 'get_history', user_id: user.user_id },
    });
    setHistory(data?.history || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? history : history.filter((h: any) => h.status === filter);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Lịch sử sử dụng tool</h1>

      <div className="flex gap-2 flex-wrap">
        {['all', 'success', 'failed', 'blocked'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className={`rounded-lg ${filter === f ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tất cả' : statusMap[f]?.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Chưa có lịch sử</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((h: any) => (
            <Card key={h.history_id} className="glass-strong border-0 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-semibold text-sm">{h.tool_name || 'autofill'}</span>
                    <Badge variant="outline" className={statusMap[h.status]?.cls}>{statusMap[h.status]?.label}</Badge>
                  </div>
                  {h.form_url && (
                    <a href={h.form_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-xs">
                      <ExternalLink className="h-3 w-3 shrink-0" /> {h.form_url}
                    </a>
                  )}
                  {h.error_message && <p className="text-xs text-destructive">{h.error_message}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(h.ran_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
