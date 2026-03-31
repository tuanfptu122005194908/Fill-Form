import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Wallet, TrendingUp, Loader2, ChevronRight, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, pendingOrders: 0, totalRevenue: 0, totalForms: 0, totalBalance: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    const [usersRes, ordersRes] = await Promise.all([
      supabase.functions.invoke('orders', { body: { action: 'admin_get_users', admin_id: user.user_id } }),
      supabase.functions.invoke('orders', { body: { action: 'admin_get_orders', admin_id: user.user_id, status_filter: 'all' } }),
    ]);

    const users = usersRes.data?.users || [];
    const orders = ordersRes.data?.orders || [];
    const pending = orders.filter((o: any) => o.status === 'pending');
    const approved = orders.filter((o: any) => o.status === 'approved');
    const totalRevenue = approved.reduce((sum: number, o: any) => sum + Number(o.amount_vnd), 0);
    const totalForms = approved.reduce((sum: number, o: any) => sum + o.forms_to_add, 0);
    const totalBalance = users.reduce((sum: number, u: any) => sum + (u.user_wallet?.form_balance ?? 0), 0);

    setStats({ totalUsers: users.length, pendingOrders: pending.length, totalRevenue, totalForms, totalBalance });
    setRecentOrders(orders.slice(0, 8));

    // Group revenue by month
    const monthMap: Record<string, { revenue: number; forms: number }> = {};
    approved.forEach((o: any) => {
      const month = new Date(o.created_at).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      if (!monthMap[month]) monthMap[month] = { revenue: 0, forms: 0 };
      monthMap[month].revenue += Number(o.amount_vnd);
      monthMap[month].forms += o.forms_to_add;
    });
    setRevenueData(Object.entries(monthMap).map(([month, d]) => ({ month, ...d })).slice(-6));

    setLoading(false);
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ xử lý', cls: 'bg-warning/10 text-warning border-warning/20' },
    approved: { label: 'Thành công', cls: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Từ chối', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    cancelled: { label: 'Đã hủy', cls: 'bg-muted text-muted-foreground' },
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Bảng điều khiển</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>
        <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
          <Activity className="h-3 w-3" /> Hệ thống hoạt động
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Người dùng', value: stats.totalUsers, icon: Users, gradient: 'gradient-primary', sub: 'tổng tài khoản' },
          { label: 'Đơn chờ xử lý', value: stats.pendingOrders, icon: CreditCard, gradient: 'gradient-secondary', sub: 'cần xem xét' },
          { label: 'Doanh thu', value: `${(stats.totalRevenue / 1000).toFixed(0)}K₫`, icon: Wallet, gradient: 'gradient-accent', sub: 'tổng thu' },
          { label: 'Form đã bán', value: stats.totalForms, icon: TrendingUp, gradient: 'gradient-primary', sub: `${stats.totalBalance} đang lưu hành` },
        ].map((s) => (
          <Card key={s.label} className="glass-strong border-0 p-4 hover-lift transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl ${s.gradient}`}>
                <s.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      {revenueData.length > 0 && (
        <Card className="glass-strong border-0 p-6">
          <h2 className="font-bold text-sm mb-1">Doanh thu theo tháng</h2>
          <p className="text-xs text-muted-foreground mb-4">Biểu đồ doanh thu và số form đã bán</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                formatter={(v: number, name: string) => [name === 'revenue' ? `${v.toLocaleString()}₫` : `${v} forms`, name === 'revenue' ? 'Doanh thu' : 'Forms']}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              <Area yAxisId="right" type="monotone" dataKey="forms" stroke="hsl(var(--secondary))" fill="url(#colorForms)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--secondary))' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent orders */}
      <Card className="glass-strong border-0 overflow-hidden">
        <div className="h-1 gradient-primary" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm">Đơn hàng gần đây</h2>
              <p className="text-xs text-muted-foreground">Thanh toán tự động qua Sepay</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/admin/orders')}>
              Xem tất cả <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có đơn hàng nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã đơn</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forms</th>
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any) => (
                    <tr key={o.order_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-xs">#{o.order_id}</td>
                      <td className="py-3 px-3">
                        <span className="text-sm">{o.users?.email || `User #${o.user_id}`}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">{Number(o.amount_vnd).toLocaleString()}₫</td>
                      <td className="py-3 px-3 text-right font-semibold text-primary">{o.forms_to_add}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className={`text-xs ${statusMap[o.status]?.cls}`}>{statusMap[o.status]?.label}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
