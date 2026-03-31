import { useEffect, useState } from 'react';
import { FileText, Loader2, Search, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  success: { label: 'Thành công', icon: CheckCircle, cls: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Thất bại', icon: XCircle, cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  blocked: { label: 'Bị chặn', icon: Ban, cls: 'bg-warning/10 text-warning border-warning/20' },
};

export default function AdminFormHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadHistory(); }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'admin_get_form_history', admin_id: user.user_id },
    });
    setHistory(data?.history || []);
    setLoading(false);
  };

  const filtered = history
    .filter((h: any) => filter === 'all' || h.status === filter)
    .filter((h: any) =>
      search === '' ||
      (h.form_url || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.users?.email || '').toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    total: history.length,
    success: history.filter((h: any) => h.status === 'success').length,
    failed: history.filter((h: any) => h.status === 'failed').length,
    blocked: history.filter((h: any) => h.status === 'blocked').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Lịch sử sử dụng tool</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tổng', value: stats.total, cls: 'text-foreground' },
          { label: 'Thành công', value: stats.success, cls: 'text-success' },
          { label: 'Thất bại', value: stats.failed, cls: 'text-destructive' },
          { label: 'Bị chặn', value: stats.blocked, cls: 'text-warning' },
        ].map((s) => (
          <Card key={s.label} className="glass-strong border-0 p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.cls}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {['all', 'success', 'failed', 'blocked'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className={`rounded-lg ${filter === f ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tất cả' : statusConfig[f]?.label}
          </Button>
        ))}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm URL, email..."
            className="pl-10 h-9 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Chưa có lịch sử</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((h: any) => {
            const cfg = statusConfig[h.status] || statusConfig.success;
            const Icon = cfg.icon;
            return (
              <Card key={h.history_id} className="glass-strong border-0 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${h.status === 'success' ? 'bg-success/10' : h.status === 'failed' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">{h.tool_name || 'AutoFill Tool'}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.users?.email || `User #${h.user_id}`} • {new Date(h.ran_at).toLocaleString('vi-VN')}
                      </p>
                      {h.form_url && (
                        <p className="text-xs text-muted-foreground truncate max-w-md">{h.form_url}</p>
                      )}
                      {h.error_message && (
                        <p className="text-xs text-destructive">{h.error_message}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={cfg.cls}>{cfg.label}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
