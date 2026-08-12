import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, History, CreditCard, Settings, LogOut, Sparkles, Zap, TrendingUp, TrendingDown, Clock, ChevronRight, Plus, ArrowRight, User } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0">
        <div className="orb orb-primary w-[600px] h-[600px] -top-60 -right-60 animate-float" />
        <div className="orb orb-secondary w-[500px] h-[500px] top-1/3 -left-60 animate-float" style={{ animationDelay: '-2s' }} />
        <div className="orb orb-accent w-[400px] h-[400px] bottom-20 right-10 animate-float" style={{ animationDelay: '-4s' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-strong">
        <div className="container max-w-6xl flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow-md group-hover:shadow-glow transition-all hover:scale-110">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-white">AutoFill</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full gradient-hero text-white text-sm font-bold shadow-glow-sm">
              <Zap className="h-4 w-4" />
              <span>{wallet?.form_balance ?? 0}</span>
              <span className="text-white/80">lượt</span>
            </div>
            <div className="relative">
              {/* Mũi tên nhấp nháy chỉ vào hồ sơ */}
              <div className="absolute -bottom-12 -right-2 z-50 animate-bounce">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-purple-500 mx-auto"></div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg mt-1">
                  <ArrowRight className="h-3 w-3 animate-pulse" />
                  <span>Hồ sơ ở đây!</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl text-xs gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 hover:border-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 font-bold px-4 py-2.5 shadow-glow-sm hover:shadow-glow transition-all hover:scale-105 text-white"
                onClick={() => navigate('/dashboard/profile')}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-white leading-tight">👤 Hồ sơ</span>
                  <span className="text-xs text-purple-200 leading-tight">{profile?.full_name || user.email?.split('@')[0]}</span>
                </div>
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs text-red-400 gap-1 hover:text-red-300 hover:bg-red-500/10" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-6 py-8 relative z-10 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-white/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Online</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white">
            Xin chào, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{profile?.full_name || user.email}</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">Quản lý tài khoản và lượt sử dụng AutoFill Tool</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          <Card className="glass-strong border border-white/10 overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="h-1 gradient-hero"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-glow-sm">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">Số dư hiện tại</p>
              <p className="text-3xl font-bold text-white">{wallet?.form_balance ?? 0}</p>
              <p className="text-green-400 text-sm mt-2">lượt còn lại</p>
            </div>
          </Card>

          <Card className="glass-strong border border-white/10 overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="h-1 gradient-secondary"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center shadow-glow-sm">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">Tổng đã nạp</p>
              <p className="text-3xl font-bold text-white">{wallet?.total_forms_added ?? 0}</p>
              <p className="text-blue-400 text-sm mt-2">lượt nạp</p>
            </div>
          </Card>

          <Card className="glass-strong border border-white/10 overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="h-1 gradient-accent"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-glow-sm">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-400" />
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">Tổng đã dùng</p>
              <p className="text-3xl font-bold text-white">{wallet?.total_forms_used ?? 0}</p>
              <p className="text-orange-400 text-sm mt-2">lượt đã tiêu</p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
          <Button onClick={() => navigate('/recharge')} className="gap-3 rounded-xl gradient-hero text-white font-bold hover:opacity-90 shadow-glow-md border-2 border-white/20 hover:scale-105 transition-all px-6 py-3 h-14 text-base">
            <Plus className="h-5 w-5" />
            <span>Nạp thêm lượt</span>
          </Button>
          <div className="relative flex-1">
            {/* Mũi tên nhấp nháy chỉ vào nút tool */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-amber-500 mx-auto"></div>
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg mt-1">
                <span>🚀 Dùng Tool ngay!</span>
                <ArrowRight className="h-4 w-4 animate-pulse" />
              </div>
            </div>
            
            <Button onClick={() => navigate('/')} className="w-full gap-4 rounded-xl gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:opacity-90 shadow-glow-lg border-2 border-amber-400/50 hover:border-amber-400 hover:scale-105 transition-all px-8 py-4 h-16 text-lg">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">🚀 Sử dụng Tool</span>
            </Button>
          </div>
        </div>

        {/* Orders */}
        <Card className="glass-strong border border-white/10 overflow-hidden animate-fade-in-up group hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: '0.1s' }}>
          <div className="h-1 gradient-secondary"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center shadow-glow-sm">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Lịch sử nạp tiền</h2>
                  <p className="text-white/60 text-sm">Các giao dịch nạp lượt gần đây</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/dashboard/orders')}>
                Xem tất cả
              </Button>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-white/60">Chưa có giao dịch nạp tiền nào</p>
                <Button onClick={() => navigate('/recharge')} className="mt-4 gradient-hero text-white">
                  Nạp lượt đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.order_id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{Number(order.amount_vnd).toLocaleString()}đ → {order.forms_to_add} lượt</p>
                        <p className="text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${statusColors[order.status] || ''} border-current`}>
                      {order.status === 'pending' ? '⏳ Chờ duyệt' : order.status === 'approved' ? '✅ Đã duyệt' : order.status === 'rejected' ? '❌ Từ chối' : order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Transactions */}
        <Card className="glass-strong border border-white/10 overflow-hidden animate-fade-in-up group hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 gradient-accent"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow-sm">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Lịch sử giao dịch</h2>
                  <p className="text-white/60 text-sm">Hoạt động sử dụng tool</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/dashboard/transactions')}>
                Xem tất cả
              </Button>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-white/60">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((txn: any) => (
                  <div key={txn.txn_id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {txn.type === 'credit' ? (
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{txn.description || (txn.type === 'credit' ? 'Nạp lượt' : 'Sử dụng')}</p>
                        <p className="text-white/60 text-sm">{new Date(txn.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-lg ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
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
