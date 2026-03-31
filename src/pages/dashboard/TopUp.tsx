import { useState, useEffect, useRef } from 'react';
import { CreditCard, QrCode, Copy, Check, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type ViewState = 'select' | 'payment' | 'success';

export default function TopUp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(35000);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const [pricePerForm, setPricePerForm] = useState(350);
  const [view, setView] = useState<ViewState>('select');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.functions.invoke('orders', {
          body: { action: 'get_public_settings' },
        });
        if (data?.settings?.pricing?.price_per_form) {
          setPricePerForm(data.settings.pricing.price_per_form);
        }
      } catch {}
    };
    loadSettings();
  }, []);

  // Polling for order status
  useEffect(() => {
    if (view === 'payment' && order) {
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await supabase.functions.invoke('orders', {
            body: { action: 'check_order_status', order_id: order.order_id, user_id: user?.user_id },
          });
          if (data?.order?.status === 'approved') {
            setCreditsAdded(data.order.forms_to_add);
            setView('success');
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        } catch {}
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [view, order, user]);

  const formsToAdd = Math.floor(amount / pricePerForm);

  const presets = [
    { amount: pricePerForm * 100, forms: 100 },
    { amount: pricePerForm * 200, forms: 200 },
    { amount: pricePerForm * 500, forms: 500 },
    { amount: pricePerForm * 1000, forms: 1000 },
  ];

  const handleCreateOrder = async () => {
    if (!user || formsToAdd <= 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orders', {
        body: { action: 'create_order', user_id: user.user_id, amount_vnd: amount },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setOrder(data.order);
      setPayment(data.payment);
      setView('payment');
      toast({ title: 'Tạo đơn thành công! Quét QR để thanh toán.' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    toast({ title: 'Đã copy!' });
  };

  if (view === 'success') {
    return (
      <div className="p-4 md:p-8+ max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="glass-strong border-0 p-8 text-center space-y-6 w-full max-w-md">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold">Nạp thành công!</h2>
            <p className="text-muted-foreground">
              Bạn đã nhận được <span className="font-bold text-primary text-lg">{creditsAdded.toLocaleString()}</span> lượt sử dụng
            </p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 space-y-1">
            <p className="text-xs text-muted-foreground">Đơn hàng</p>
            <p className="font-semibold">#{order?.order_id}</p>
            <p className="text-xs text-muted-foreground mt-2">Số tiền</p>
            <p className="font-semibold">{Number(order?.amount_vnd).toLocaleString()}đ</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chính
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Nạp lượt sử dụng</h1>
        <p className="text-muted-foreground text-sm">{pricePerForm.toLocaleString()}đ / lượt</p>
      </div>

      {view === 'select' ? (
        <Card className="glass-strong border-0 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {presets.map((p) => (
              <button
                key={p.amount}
                onClick={() => setAmount(p.amount)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  amount === p.amount ? 'border-primary bg-primary/5 shadow-glow-sm' : 'border-border/50 hover:border-primary/50'
                }`}
              >
                <p className="text-lg font-bold">{p.amount.toLocaleString()}đ</p>
                <p className="text-sm text-muted-foreground">{p.forms.toLocaleString()} lượt</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Số tiền tuỳ chỉnh</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(parseInt(e.target.value) || 0, 100000000))}
              className="h-12 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary text-lg font-bold"
              min={pricePerForm}
              step={1000}
            />
            <p className="text-sm text-muted-foreground">
              Nhận <span className="font-bold text-primary">{formsToAdd.toLocaleString()}</span> lượt
            </p>
          </div>

          <Button
            onClick={handleCreateOrder}
            disabled={loading || formsToAdd <= 0}
            className="w-full h-12 gap-2 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            Tạo đơn nạp {formsToAdd > 0 ? `${formsToAdd.toLocaleString()} lượt` : ''}
          </Button>
        </Card>
      ) : (
        <Card className="glass-strong border-0 overflow-hidden">
          <div className="h-1.5 gradient-hero" />
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning font-semibold text-sm mb-3">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ thanh toán...
              </div>
              <h2 className="text-lg font-bold">Quét QR để chuyển khoản</h2>
              <p className="text-xs text-muted-foreground mt-1">Hệ thống sẽ tự động xác nhận sau khi nhận tiền</p>
            </div>

            {payment?.qr_code_url && (
              <div className="flex justify-center">
                <div className="p-3 bg-card rounded-2xl shadow-lg border border-border/50">
                  {/* Use Sepay QR if it's a Sepay URL, otherwise use original */}
                  {payment.qr_code_url.includes('sepay.vn') ? (
                    <img src={payment.qr_code_url} alt="QR" className="w-56 h-56 rounded-xl" />
                  ) : (
                    // Generate Sepay QR on the fly
                    <img 
                      src={`https://qr.sepay.vn/img?acc=96247PAY05&bank=BIDV&amount=${payment?.amount_vnd}&des=${order?.transfer_content}`}
                      alt="QR" 
                      className="w-56 h-56 rounded-xl" 
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {[
                { label: 'Ngân hàng', value: payment?.bank_name, key: 'bank' },
                { label: 'Số TK', value: payment?.bank_account_no, key: 'acc' },
                { label: 'Tên TK', value: payment?.bank_account_name, key: 'name' },
                { label: 'Số tiền', value: `${Number(payment?.amount_vnd).toLocaleString()}đ`, key: 'amount' },
                { label: 'Nội dung CK', value: order?.transfer_content, key: 'content' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-sm">{item.value}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyText(item.value || '', item.key)}>
                    {copied === item.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary font-medium">💡 Chuyển khoản đúng nội dung để hệ thống tự động xác nhận trong vài giây.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
