import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, History, CreditCard, Settings, LogOut, Sparkles, Zap, TrendingUp, TrendingDown, Clock, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, profile, wallet, logout, refreshWallet } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    await refreshWallet();

    const [txnRes, orderRes] = await Promise.all([
      supabase.functions.invoke('wallet', { body: { action: 'get_transactions', user_id: user.user_id } }),
      supabase.functions.invoke('orders', { body: { action: 'get_orders', user_id: user.user_id } }),
    ]);

    setTransactions(txnRes.data?.transactions || []);
    setOrders(orderRes.data?.orders || []);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    cancelled: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="orb orb-primary w-[400px] h-[400px] -top-40 -right-40 animate-float" />
      <div className="orb orb-secondary w-[300px] h-[300px] bottom-20 -left-20 animate-float" style={{ animationDelay: '-2s' }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container max-w-5xl flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-gradient hidden sm:block">AutoFill</span>
          </Link>
          <div className="flex items-center gap-3">
            {user.role === 'ADMIN' && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/admin')}>
                <Settings className="h-4 w-4 mr-1" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate('/')}>
              <Zap className="h-4 w-4 mr-1" />
              Tool
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Thoát
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl px-4 py-8 relative z-10 space-y-8">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Xin chào, <span className="text-gradient">{profile?.full_name || user.email}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý tài khoản và lượt sử dụng</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          <Card className="glass-strong border-0 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 gradient-primary opacity-10 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl gradient-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Số dư</span>
            </div>
            <p className="text-3xl font-extrabold">{wallet?.form_balance ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">lượt còn lại</p>
          </Card>

          <Card className="glass-strong border-0 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 gradient-secondary opacity-10 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl gradient-secondary">
                <TrendingUp className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Đã nạp</span>
            </div>
            <p className="text-3xl font-extrabold">{wallet?.total_forms_added ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">tổng lượt</p>
          </Card>

          <Card className="glass-strong border-0 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 gradient-accent opacity-10 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl gradient-accent">
                <TrendingDown className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Đã dùng</span>
            </div>
            <p className="text-3xl font-extrabold">{wallet?.total_forms_used ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">tổng lượt</p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 animate-fade-in">
          <Button onClick={() => navigate('/recharge')} className="gap-2 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Nạp thêm lượt
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2 rounded-xl font-bold border-2">
            <Zap className="h-4 w-4" />
            Sử dụng Tool
          </Button>
        </div>

        {/* Orders */}
        <Card className="glass-strong border-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="h-1 gradient-secondary" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-bold">Lịch sử nạp tiền</h2>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có giao dịch nạp tiền nào</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.order_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{Number(order.amount_vnd).toLocaleString()}đ → {order.forms_to_add} lượt</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[order.status] || ''}>
                      {order.status === 'pending' ? 'Chờ duyệt' : order.status === 'approved' ? 'Đã duyệt' : order.status === 'rejected' ? 'Từ chối' : order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Transactions */}
        <Card className="glass-strong border-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 gradient-accent" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <History className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold">Lịch sử giao dịch</h2>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có giao dịch nào</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((txn: any) => (
                  <div key={txn.txn_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {txn.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{txn.description || (txn.type === 'credit' ? 'Nạp lượt' : 'Sử dụng')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${txn.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{txn.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
