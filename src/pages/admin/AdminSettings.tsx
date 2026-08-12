import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, Banknote, Gauge, Wrench, ImagePlus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bankName, setBankName] = useState('MB Bank');
  const [bankAccountNo, setBankAccountNo] = useState('0354860785');
  const [bankAccountName, setBankAccountName] = useState('CAO MINH TUAN');
  const [bankImageUrl, setBankImageUrl] = useState('');
  const [pricePerForm, setPricePerForm] = useState(350);
  const [maxFormsPerDay, setMaxFormsPerDay] = useState(500);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('Hệ thống đang bảo trì');

  useEffect(() => { loadSettings(); }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: { action: 'admin_get_settings', admin_id: user.user_id },
      });
      if (data?.settings) {
        const s = data.settings;
        if (s.bank_info) {
          setBankName(s.bank_info.bank_name || 'MB Bank');
          setBankAccountNo(s.bank_info.account_no || '');
          setBankAccountName(s.bank_info.account_name || '');
          setBankImageUrl(s.bank_info.image_url || '');
        }
        if (s.pricing) setPricePerForm(s.pricing.price_per_form || 350);
        if (s.limits) setMaxFormsPerDay(s.limits.max_forms_per_day || 500);
        if (s.maintenance) {
          setMaintenanceMode(s.maintenance.enabled || false);
          setMaintenanceMsg(s.maintenance.message || '');
        }
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await supabase.functions.invoke('orders', {
        body: {
          action: 'admin_save_settings',
          admin_id: user.user_id,
          settings: {
            bank_info: { bank_name: bankName, account_no: bankAccountNo, account_name: bankAccountName, image_url: bankImageUrl },
            pricing: { price_per_form: pricePerForm, currency: 'VND' },
            limits: { max_forms_per_day: maxFormsPerDay },
            maintenance: { enabled: maintenanceMode, message: maintenanceMsg },
          },
        },
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: '✅ Đã lưu cài đặt thành công! Thay đổi sẽ áp dụng ngay cho tất cả user.' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Cài đặt hệ thống</h1>

      {/* Bank Info */}
      <Card className="glass-strong border-0 overflow-hidden">
        <div className="h-1 gradient-primary" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Thông tin chuyển khoản</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tên ngân hàng</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Số tài khoản</Label>
              <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Tên chủ TK</Label>
              <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label>Ảnh QR / Ảnh chuyển khoản (URL)</Label>
            <Input value={bankImageUrl} onChange={(e) => setBankImageUrl(e.target.value)} 
              placeholder="https://example.com/qr.png" className="rounded-xl mt-1" />
            {bankImageUrl && (
              <div className="mt-3 relative inline-block">
                <img src={bankImageUrl} alt="Bank QR" className="w-40 h-40 object-contain rounded-xl border border-border/50" />
                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setBankImageUrl('')}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="glass-strong border-0 overflow-hidden">
        <div className="h-1 gradient-secondary" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-5 w-5 text-secondary" />
            <h2 className="font-bold">Giá & Giới hạn</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Giá mỗi form (VNĐ)</Label>
              <Input type="number" value={pricePerForm} onChange={(e) => setPricePerForm(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Max form/ngày</Label>
              <Input type="number" value={maxFormsPerDay} onChange={(e) => setMaxFormsPerDay(parseInt(e.target.value) || 0)} className="rounded-xl mt-1" />
            </div>
          </div>
        </div>
      </Card>

      {/* Maintenance */}
      <Card className="glass-strong border-0 overflow-hidden">
        <div className="h-1 gradient-accent" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-5 w-5 text-accent" />
            <h2 className="font-bold">Bảo trì</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Chế độ bảo trì</p>
              <p className="text-xs text-muted-foreground">Tắt toàn bộ tính năng cho user</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
          {maintenanceMode && (
            <div>
              <Label>Thông báo bảo trì</Label>
              <Input value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} className="rounded-xl mt-1" />
            </div>
          )}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-12 gradient-primary text-primary-foreground font-bold text-base gap-2">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        Lưu cài đặt
      </Button>
    </div>
  );
}
