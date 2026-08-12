import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Clock, Plus, Zap, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  success: 'bg-success/10 text-success border-success/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  blocked: 'bg-warning/10 text-warning border-warning/20',
};

export default function DashboardHome() {
  const { user, wallet, refreshWallet } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    await refreshWallet();
    const [txnRes, histRes, orderRes] = await Promise.all([
      supabase.functions.invoke('wallet', { body: { action: 'get_transactions', user_id: user.user_id } }),
      supabase.functions.invoke('wallet', { body: { action: 'get_history', user_id: user.user_id } }),
      supabase.functions.invoke('orders', { body: { action: 'get_orders', user_id: user.user_id } }),
    ]);
    setTransactions(txnRes.data?.transactions || []);
    setHistory(histRes.data?.history || []);
    setOrders(orderRes.data?.orders || []);
    setLoading(false);
  };

  const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">
          Xin chào, <span className="text-gradient">{useAuth().profile?.full_name || user?.email}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Quản lý tài khoản và lượt sử dụng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Số dư', value: wallet?.form_balance ?? 0, suffix: 'lượt', icon: Wallet, gradient: 'gradient-primary' },
          { label: 'Đã nạp', value: wallet?.total_forms_added ?? 0, suffix: 'lượt', icon: TrendingUp, gradient: 'gradient-secondary' },
          { label: 'Đã dùng', value: wallet?.total_forms_used ?? 0, suffix: 'lượt', icon: TrendingDown, gradient: 'gradient-accent' },
          { label: 'Đơn chờ', value: pendingOrders, suffix: 'đơn', icon: Clock, gradient: 'gradient-primary' },
        ].map((stat) => (
          <Card key={stat.label} className="glass-strong border-0 p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.gradient}`}>
                <stat.icon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.suffix}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/dashboard/topup')} className="gap-2 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg">
          <Plus className="h-4 w-4" /> Nạp thêm lượt
        </Button>
        <Button onClick={() => navigate('/')} variant="outline" className="gap-2 rounded-xl font-bold border-2">
          <Zap className="h-4 w-4" /> Sử dụng Tool
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card className="glass-strong border-0 overflow-hidden">
          <div className="h-1 gradient-secondary" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-secondary" /> Đơn nạp gần đây</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/dashboard/orders')}>
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn nạp</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 3).map((order: any) => (
                  <div key={order.order_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-semibold">{Number(order.amount_vnd).toLocaleString()}đ → {order.forms_to_add} lượt</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[order.status] || ''}>
                      {order.status === 'pending' ? 'Chờ' : order.status === 'approved' ? 'Duyệt' : 'Từ chối'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent history */}
        <Card className="glass-strong border-0 overflow-hidden">
          <div className="h-1 gradient-accent" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Sử dụng gần đây</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/dashboard/history')}>
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Chưa sử dụng tool</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((h: any) => (
                  <div key={h.history_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-semibold">{h.tool_name || 'autofill'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.ran_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[h.status] || ''}>
                      {h.status === 'success' ? '✓' : h.status === 'blocked' ? 'Hết lượt' : '✗'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
