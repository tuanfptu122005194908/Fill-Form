import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, CreditCard, Check, X, Loader2, Sparkles, ArrowLeft, Eye, Ban, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, filter]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [ordersRes, usersRes] = await Promise.all([
      supabase.functions.invoke('orders', {
        body: { action: 'admin_get_orders', admin_id: user.user_id, status_filter: filter },
      }),
      supabase.functions.invoke('orders', {
        body: { action: 'admin_get_users', admin_id: user.user_id },
      }),
    ]);

    setOrders(ordersRes.data?.orders || []);
    setUsers(usersRes.data?.users || []);
    setLoading(false);
  };

  const handleApprove = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_approve_order', admin_id: user!.user_id, order_id: orderId },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Đã duyệt đơn hàng!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_reject_order', admin_id: user!.user_id, order_id: orderId },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Đã từ chối đơn hàng' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUser = async (targetUserId: number, newStatus: 'active' | 'blocked') => {
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_toggle_user_status', admin_id: user!.user_id, target_user_id: targetUserId, new_status: newStatus },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: newStatus === 'blocked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  const statusLabels: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="orb orb-primary w-[400px] h-[400px] -top-40 -right-40 animate-float" />

      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container max-w-6xl flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg">Quản trị</h1>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-8 relative z-10">
        <Tabs defaultValue="orders">
          <TabsList className="mb-6 rounded-xl glass p-1">
            <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4" />
              Đơn nạp
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              Người dùng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-lg ${filter === f ? 'gradient-primary text-primary-foreground' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Tất cả' : statusLabels[f]}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Không có đơn nào</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <Card key={order.order_id} className="glass-strong border-0 p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Đơn #{order.order_id}</span>
                          <Badge variant="outline" className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.users?.email || `User #${order.user_id}`} • {new Date(order.created_at).toLocaleString('vi-VN')}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{Number(order.amount_vnd).toLocaleString()}đ</span>
                          {' → '}
                          <span className="font-semibold text-primary">{order.forms_to_add} lượt</span>
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">{order.transfer_content}</p>
                      </div>

                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                            onClick={() => handleApprove(order.order_id)}
                            disabled={actionLoading === order.order_id}
                          >
                            {actionLoading === order.order_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1 rounded-lg"
                            onClick={() => handleReject(order.order_id)}
                            disabled={actionLoading === order.order_id}
                          >
                            <X className="h-4 w-4" />
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-3">
                {users.map((u: any) => (
                  <Card key={u.user_id} className="glass-strong border-0 p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{u.user_profile?.[0]?.full_name || u.email}</span>
                          <Badge variant="outline" className={u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : ''}>
                            {u.role}
                          </Badge>
                          <Badge variant="outline" className={u.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                            {u.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Ví: <span className="font-semibold">{u.user_wallet?.[0]?.form_balance ?? 0}</span> lượt
                          {' | Đã dùng: '}<span className="font-semibold">{u.user_wallet?.[0]?.total_forms_used ?? 0}</span>
                          {' | Đã nạp: '}<span className="font-semibold">{u.user_wallet?.[0]?.total_forms_added ?? 0}</span>
                        </p>
                      </div>
                      {u.user_id !== user!.user_id && (
                        <Button
                          size="sm"
                          variant={u.status === 'active' ? 'destructive' : 'default'}
                          className="gap-1 rounded-lg"
                          onClick={() => handleToggleUser(u.user_id, u.status === 'active' ? 'blocked' : 'active')}
                        >
                          {u.status === 'active' ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
