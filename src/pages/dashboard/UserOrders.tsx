import { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ duyệt', cls: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Đã duyệt', cls: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Từ chối', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled: { label: 'Đã hủy', cls: 'bg-muted text-muted-foreground' },
};

export default function UserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadOrders(); }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'get_orders', user_id: user.user_id },
    });
    setOrders(data?.orders || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o: any) => o.status === filter);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Lịch sử đơn nạp</h1>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
        <p className="text-center text-muted-foreground py-12">Không có đơn nào</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => (
            <Card key={order.order_id} className="glass-strong border-0 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-secondary" />
                    <span className="font-bold text-sm">Đơn #{order.order_id}</span>
                    <Badge variant="outline" className={statusMap[order.status]?.cls}>{statusMap[order.status]?.label}</Badge>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">{Number(order.amount_vnd).toLocaleString()}đ</span>
                    {' → '}<span className="font-semibold text-primary">{order.forms_to_add} lượt</span>
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{order.transfer_content}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
