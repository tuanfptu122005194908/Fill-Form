import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PRICE_PER_FORM = 350;

const presets = [
  { amount: 35000, forms: 100 },
  { amount: 70000, forms: 200 },
  { amount: 175000, forms: 500 },
  { amount: 350000, forms: 1000 },
];

const Recharge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(35000);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const formsToAdd = Math.floor(amount / PRICE_PER_FORM);

  const handleCreateOrder = async () => {
    if (formsToAdd <= 0) {
      toast({ title: 'Lỗi', description: `Số tiền tối thiểu là ${PRICE_PER_FORM.toLocaleString()}đ`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orders', {
        body: { action: 'create_order', user_id: user.user_id, amount_vnd: amount },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setOrder(data.order);
      setPayment(data.payment);
      toast({ title: 'Tạo đơn thành công', description: 'Vui lòng chuyển khoản theo thông tin bên dưới' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Đã copy!' });
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh relative overflow-hidden">
      <div className="orb orb-primary w-[400px] h-[400px] -top-40 -right-40 animate-float" />
      <div className="orb orb-secondary w-[300px] h-[300px] bottom-20 -left-20 animate-float" style={{ animationDelay: '-2s' }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container max-w-3xl flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-bold text-lg">Nạp lượt sử dụng</h1>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8 relative z-10 space-y-6">
        {!order ? (
          <>
            {/* Pricing info */}
            <Card className="glass-strong border-0 p-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
                  <CreditCard className="h-4 w-4" />
                  {PRICE_PER_FORM.toLocaleString()}đ / lượt
                </div>
                <h2 className="text-xl font-bold">Chọn gói nạp</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {presets.map((preset) => (
                  <button
                    key={preset.amount}
                    onClick={() => setAmount(preset.amount)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      amount === preset.amount
                        ? 'border-primary bg-primary/5 shadow-glow-sm'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <p className="text-lg font-bold">{preset.amount.toLocaleString()}đ</p>
                    <p className="text-sm text-muted-foreground">{preset.forms.toLocaleString()} lượt</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold">Hoặc nhập số tiền tuỳ chỉnh</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="h-12 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary text-lg font-bold"
                  min={PRICE_PER_FORM}
                  step={1000}
                />
                <p className="text-sm text-muted-foreground">
                  Bạn sẽ nhận được <span className="font-bold text-primary">{formsToAdd.toLocaleString()}</span> lượt sử dụng
                </p>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={loading || formsToAdd <= 0}
                className="w-full h-13 gap-2 rounded-xl gradient-primary text-primary-foreground font-bold text-base hover:opacity-90 shadow-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                Tạo đơn nạp {formsToAdd > 0 ? `${formsToAdd.toLocaleString()} lượt` : ''}
              </Button>
            </Card>
          </>
        ) : (
          /* Payment info */
          <Card className="glass-strong border-0 overflow-hidden animate-fade-in-up">
            <div className="h-1.5 gradient-hero" />
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning font-semibold text-sm mb-4">
                  <QrCode className="h-4 w-4" />
                  Chờ thanh toán
                </div>
                <h2 className="text-xl font-bold">Chuyển khoản ngân hàng</h2>
                <p className="text-sm text-muted-foreground mt-1">Quét QR hoặc chuyển khoản thủ công</p>
              </div>

              {/* QR Code */}
              {payment?.qr_code_url && (
                <div className="flex justify-center">
                  <div className="p-3 bg-card rounded-2xl shadow-lg border border-border/50">
                    <img src={payment.qr_code_url} alt="QR Code" className="w-64 h-64 rounded-xl" />
                  </div>
                </div>
              )}

              {/* Bank details */}
              <div className="space-y-3">
                {[
                  { label: 'Ngân hàng', value: payment?.bank_name },
                  { label: 'Số tài khoản', value: payment?.bank_account_no },
                  { label: 'Tên tài khoản', value: payment?.bank_account_name },
                  { label: 'Số tiền', value: `${Number(payment?.amount_vnd).toLocaleString()}đ` },
                  { label: 'Nội dung CK', value: payment?.transfer_content, important: true },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.important ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`font-semibold ${item.important ? 'text-primary' : ''}`}>{item.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => copyContent(item.value || '')}
                    >
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                <p className="text-sm text-warning font-medium">⚠️ Lưu ý quan trọng</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vui lòng nhập đúng nội dung chuyển khoản. Admin sẽ duyệt đơn trong vòng 24h.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => { setOrder(null); setPayment(null); }} variant="outline" className="flex-1 rounded-xl font-semibold border-2">
                  Tạo đơn mới
                </Button>
                <Button onClick={() => navigate('/dashboard')} className="flex-1 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90">
                  Về Dashboard
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Recharge;
