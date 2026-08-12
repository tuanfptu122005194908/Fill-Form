import { useState } from 'react';
import { User, Save, Loader2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'update_profile', user_id: user.user_id, full_name: fullName.trim(), phone: phone.trim() || null },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Đã cập nhật hồ sơ!' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !currentPassword || !newPassword || newPassword.length < 6) {
      toast({ title: 'Mật khẩu mới phải ít nhất 6 ký tự', variant: 'destructive' });
      return;
    }
    setChangingPw(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'change_password', user_id: user.user_id, current_password: currentPassword, new_password: newPassword },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Hồ sơ cá nhân</h1>

      <Card className="glass-strong border-0 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl gradient-primary">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="font-bold">Thông tin cá nhân</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Email</label>
          <Input value={user?.email || ''} disabled className="h-11 rounded-xl bg-muted/50" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Họ tên</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Số điện thoại</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567"
            className="h-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </Button>
      </Card>

      <Card className="glass-strong border-0 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl gradient-secondary">
            <Lock className="h-5 w-5 text-secondary-foreground" />
          </div>
          <h2 className="font-bold">Đổi mật khẩu</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Mật khẩu hiện tại</label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Mật khẩu mới</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Ít nhất 6 ký tự"
            className="h-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary" />
        </div>

        <Button onClick={handleChangePassword} disabled={changingPw} variant="outline" className="gap-2 rounded-xl font-bold border-2">
          {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Đổi mật khẩu
        </Button>
      </Card>
    </div>
  );
}
