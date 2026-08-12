import { useEffect, useState } from 'react';
import { Wallet, Plus, Minus, Loader2, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

export default function AdminWallets() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creditDialog, setCreditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditType, setCreditType] = useState<'credit' | 'debit'>('credit');
  const [creditDesc, setCreditDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadUsers(); }, [user]);

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'admin_get_users', admin_id: user.user_id },
    });
    setUsers(data?.users || []);
    setLoading(false);
  };

  const openCreditDialog = (u: any, type: 'credit' | 'debit') => {
    setSelectedUser(u);
    setCreditType(type);
    setCreditAmount(0);
    setCreditDesc('');
    setCreditDialog(true);
  };

  const handleAdjustCredit = async () => {
    if (!selectedUser || !user || creditAmount <= 0) return;
    setActionLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: {
          action: 'admin_adjust_credit', admin_id: user.user_id,
          target_user_id: selectedUser.user_id, amount: creditAmount,
          type: creditType, description: creditDesc || (creditType === 'credit' ? 'Admin cộng credit' : 'Admin trừ credit'),
        },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: creditType === 'credit' ? '✅ Đã cộng credit' : '✅ Đã trừ credit' });
      setCreditDialog(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const filtered = users.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.user_profile?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.reduce((sum: number, u: any) => sum + (u.user_wallet?.form_balance ?? 0), 0);
  const totalAdded = users.reduce((sum: number, u: any) => sum + (u.user_wallet?.total_forms_added ?? 0), 0);
  const totalUsed = users.reduce((sum: number, u: any) => sum + (u.user_wallet?.total_forms_used ?? 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Quản lý ví</h1>
        <Button variant="outline" size="sm" onClick={loadUsers} className="gap-1.5 rounded-lg">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng số dư', value: totalBalance, color: 'text-primary' },
          { label: 'Tổng đã nạp', value: totalAdded, color: 'text-success' },
          { label: 'Tổng đã dùng', value: totalUsed, color: 'text-secondary' },
        ].map((s) => (
          <Card key={s.label} className="glass-strong border-0 p-4 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm user..."
          className="pl-10 h-10 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Card className="glass-strong border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số dư</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã nạp</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã dùng</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => {
                  const w = u.user_wallet;
                  return (
                    <tr key={u.user_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold">{u.user_profile?.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-primary text-lg">{w?.form_balance ?? 0}</td>
                      <td className="py-3 px-4 text-right font-semibold text-success">{w?.total_forms_added ?? 0}</td>
                      <td className="py-3 px-4 text-right font-semibold">{w?.total_forms_used ?? 0}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" className="gap-1 rounded-lg bg-success text-success-foreground hover:bg-success/90 h-7 text-xs"
                            onClick={() => openCreditDialog(u, 'credit')}>
                            <Plus className="h-3 w-3" /> Cộng
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1 rounded-lg h-7 text-xs"
                            onClick={() => openCreditDialog(u, 'debit')}>
                            <Minus className="h-3 w-3" /> Trừ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Credit Dialog */}
      <Dialog open={creditDialog} onOpenChange={setCreditDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>{creditType === 'credit' ? '➕ Cộng credit' : '➖ Trừ credit'}</DialogTitle>
            <DialogDescription>
              User: {selectedUser?.email} — Số dư: {selectedUser?.user_wallet?.form_balance ?? 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Số lượng form</Label>
              <Input type="number" min={1} value={creditAmount}
                onChange={(e) => setCreditAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Lý do</Label>
              <Input value={creditDesc} onChange={(e) => setCreditDesc(e.target.value)}
                placeholder="VD: Khuyến mãi, hoàn tiền..."
                className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button onClick={handleAdjustCredit} disabled={actionLoading || creditAmount <= 0}
              className={`rounded-lg ${creditType === 'credit' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creditType === 'credit' ? `Cộng ${creditAmount}` : `Trừ ${creditAmount}`} forms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
