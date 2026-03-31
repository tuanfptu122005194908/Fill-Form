import { useEffect, useState } from 'react';
import { Users, Ban, UserCheck, Loader2, Search, Shield, Trash2, Edit, Plus, Minus, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
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

  const handleToggle = async (targetId: number, newStatus: 'active' | 'blocked') => {
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_toggle_user_status', admin_id: user!.user_id, target_user_id: targetId, new_status: newStatus },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: newStatus === 'blocked' ? '🔒 Đã khóa' : '✅ Đã mở khóa' });
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !user) return;
    setActionLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_update_user', admin_id: user.user_id, target_user_id: selectedUser.user_id, role: editRole },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã cập nhật' });
      setEditDialog(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser || !user) return;
    setActionLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_delete_user', admin_id: user.user_id, target_user_id: selectedUser.user_id },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã xoá user' });
      setDeleteDialog(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const handleConfirmCredit = async () => {
    if (!selectedUser || !user || creditAmount <= 0) return;
    setActionLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: {
          action: 'admin_adjust_credit', admin_id: user.user_id,
          target_user_id: selectedUser.user_id, amount: creditAmount,
          type: creditType, description: creditDesc,
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

  const filtered = users.filter((u: any) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.user_profile?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalBalance = users.reduce((sum: number, u: any) => sum + (u.user_wallet?.form_balance ?? 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} người dùng • Tổng số dư: {totalBalance} forms</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} className="gap-1.5 rounded-lg">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo email, tên..."
            className="pl-10 h-10 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả role</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
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
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số dư</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã nạp</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã dùng</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.user_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{u.user_profile?.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : ''}>
                        {u.role === 'ADMIN' ? <><Shield className="h-3 w-3 mr-1" />Admin</> : 'User'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={u.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                        {u.status === 'active' ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary">{u.user_wallet?.form_balance ?? 0}</td>
                    <td className="py-3 px-4 text-right font-semibold text-success">{u.user_wallet?.total_forms_added ?? 0}</td>
                    <td className="py-3 px-4 text-right font-semibold">{u.user_wallet?.total_forms_used ?? 0}</td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4 text-center">
                      {u.user_id !== user!.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-strong border-0">
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setEditRole(u.role); setEditDialog(true); }}>
                              <Edit className="h-4 w-4 mr-2" /> Sửa role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setCreditType('credit'); setCreditAmount(0); setCreditDesc(''); setCreditDialog(true); }}>
                              <Plus className="h-4 w-4 mr-2" /> Cộng credit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setCreditType('debit'); setCreditAmount(0); setCreditDesc(''); setCreditDialog(true); }}>
                              <Minus className="h-4 w-4 mr-2" /> Trừ credit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggle(u.user_id, u.status === 'active' ? 'blocked' : 'active')}>
                              {u.status === 'active' ? <><Ban className="h-4 w-4 mr-2" /> Khoá</> : <><UserCheck className="h-4 w-4 mr-2" /> Mở khoá</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setDeleteDialog(true); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Xoá user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>Sửa role user</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Role</Label>
            <Select value={editRole} onValueChange={(v) => setEditRole(v as 'USER' | 'ADMIN')}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading} className="rounded-lg gradient-primary text-primary-foreground">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>⚠️ Xác nhận xoá user</DialogTitle>
            <DialogDescription>Xoá <strong>{selectedUser?.email}</strong>? Không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionLoading} className="rounded-lg">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />} Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                placeholder="VD: Khuyến mãi, hoàn tiền..." className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button onClick={handleConfirmCredit} disabled={actionLoading || creditAmount <= 0}
              className={`rounded-lg ${creditType === 'credit' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {creditType === 'credit' ? `Cộng ${creditAmount}` : `Trừ ${creditAmount}`} forms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
