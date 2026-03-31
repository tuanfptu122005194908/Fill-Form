import { useEffect, useState } from 'react';
import { Loader2, CreditCard, Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ thanh toán', cls: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Thành công', cls: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Từ chối', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled: { label: 'Đã hủy', cls: 'bg-muted text-muted-foreground' },
};

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Create form
  const [createUserId, setCreateUserId] = useState<number>(0);
  const [createAmount, setCreateAmount] = useState(0);
  const [createForms, setCreateForms] = useState(0);
  const [createNote, setCreateNote] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form
  const [editAmount, setEditAmount] = useState(0);
  const [editForms, setEditForms] = useState(0);
  const [editStatus, setEditStatus] = useState('pending');
  const [editNote, setEditNote] = useState('');

  useEffect(() => { loadOrders(); loadUsers(); }, [user, filter]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'admin_get_orders', admin_id: user.user_id, status_filter: filter },
    });
    setOrders(data?.orders || []);
    setLoading(false);
  };

  const loadUsers = async () => {
    if (!user) return;
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'admin_get_users', admin_id: user.user_id },
    });
    setUsers(data?.users || []);
  };

  const handleCreate = async () => {
    if (!user || createUserId <= 0 || createForms <= 0) return;
    setCreateLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: {
          action: 'admin_create_order', admin_id: user.user_id,
          target_user_id: createUserId, amount_vnd: createAmount,
          forms_to_add: createForms, status: 'approved',
          note: createNote || 'Admin tạo thủ công',
        },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã tạo đơn và cộng credit' });
      setCreateDialog(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setCreateLoading(false); }
  };

  const handleEdit = async () => {
    if (!user || !selectedOrder) return;
    setActionLoading(selectedOrder.order_id);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: {
          action: 'admin_edit_order', admin_id: user.user_id,
          order_id: selectedOrder.order_id, amount_vnd: editAmount,
          forms_to_add: editForms, status: editStatus, note: editNote,
        },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã cập nhật' });
      setEditDialog(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!user || !selectedOrder) return;
    setActionLoading(selectedOrder.order_id);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_delete_order', admin_id: user.user_id, order_id: selectedOrder.order_id },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã xoá đơn' });
      setDeleteDialog(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(null); }
  };

  const openEditDialog = (order: any) => {
    setSelectedOrder(order);
    setEditAmount(order.amount_vnd);
    setEditForms(order.forms_to_add);
    setEditStatus(order.status);
    setEditNote(order.note || '');
    setEditDialog(true);
  };

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.transfer_content?.toLowerCase().includes(s) ||
      o.users?.email?.toLowerCase().includes(s) ||
      String(o.order_id).includes(s);
  });

  const totalAmount = filtered.reduce((sum: number, o: any) => o.status === 'approved' ? sum + Number(o.amount_vnd) : sum, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Quản lý đơn nạp</h1>
          <p className="text-sm text-muted-foreground">Thanh toán tự động qua Sepay • {filtered.length} đơn</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadOrders} className="gap-1.5 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-1.5 rounded-lg gradient-primary text-primary-foreground" onClick={() => {
            setCreateUserId(0); setCreateAmount(0); setCreateForms(0); setCreateNote(''); setCreateDialog(true);
          }}>
            <Plus className="h-4 w-4" /> Tạo đơn thủ công
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã đơn, email..."
            className="pl-10 h-10 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className={`rounded-lg ${filter === f ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tất cả' : statusMap[f]?.label}
          </Button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <Card className="glass-strong border-0 p-3 flex-1 text-center">
          <p className="text-xs text-muted-foreground">Tổng đơn</p>
          <p className="text-xl font-extrabold">{filtered.length}</p>
        </Card>
        <Card className="glass-strong border-0 p-3 flex-1 text-center">
          <p className="text-xs text-muted-foreground">Đã duyệt</p>
          <p className="text-xl font-extrabold text-success">{filtered.filter(o => o.status === 'approved').length}</p>
        </Card>
        <Card className="glass-strong border-0 p-3 flex-1 text-center">
          <p className="text-xs text-muted-foreground">Doanh thu</p>
          <p className="text-xl font-extrabold text-primary">{(totalAmount / 1000).toFixed(0)}K₫</p>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Không có đơn nào</p>
      ) : (
        <Card className="glass-strong border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nội dung CK</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forms</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => (
                  <tr key={order.order_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs">#{order.order_id}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{order.users?.email || `User #${order.user_id}`}</p>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-muted/50 px-2 py-0.5 rounded">{order.transfer_content}</code>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{Number(order.amount_vnd).toLocaleString()}₫</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">{order.forms_to_add}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={`text-xs ${statusMap[order.status]?.cls}`}>{statusMap[order.status]?.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(order)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { setSelectedOrder(order); setDeleteDialog(true); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>Tạo đơn nạp thủ công</DialogTitle>
            <DialogDescription>Tạo đơn và tự động cộng credit cho user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Chọn User</Label>
              <Select value={String(createUserId)} onValueChange={(v) => setCreateUserId(Number(v))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Chọn user" /></SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.user_id} value={String(u.user_id)}>
                      {u.email} ({u.user_profile?.full_name || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Số tiền (VNĐ)</Label>
                <Input type="number" value={createAmount} onChange={(e) => setCreateAmount(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Số lượt form</Label>
                <Input type="number" value={createForms} onChange={(e) => setCreateForms(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Input value={createNote} onChange={(e) => setCreateNote(e.target.value)} placeholder="VD: Khuyến mãi..." className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button onClick={handleCreate} disabled={createLoading || createUserId <= 0 || createForms <= 0}
              className="rounded-lg gradient-primary text-primary-foreground">
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tạo & Cộng credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>Sửa đơn #{selectedOrder?.order_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Số tiền (VNĐ)</Label>
                <Input type="number" value={editAmount} onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Số lượt form</Label>
                <Input type="number" value={editForms} onChange={(e) => setEditForms(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="approved">Thành công</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button onClick={handleEdit} className="rounded-lg gradient-primary text-primary-foreground">Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="glass-strong border-0">
          <DialogHeader>
            <DialogTitle>⚠️ Xoá đơn #{selectedOrder?.order_id}?</DialogTitle>
            <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-lg">Huỷ</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-lg">Xoá vĩnh viễn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
