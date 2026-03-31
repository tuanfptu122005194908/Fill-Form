import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Send, Facebook, Youtube, Shuffle, User, LogOut, Settings, Zap, Search, Loader2, ArrowRight, Star, Shield, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormUrlInput } from '@/components/FormUrlInput';
import { FieldsList } from '@/components/FieldsList';
import { SubmitProgress } from '@/components/SubmitProgress';
import { ResponsePreview } from '@/components/ResponsePreview';
import { FormSetupGuide } from '@/components/FormSetupGuide';
import { RandomResponseGenerator } from '@/components/RandomResponseGenerator';
import SakuraEffect from '@/components/SakuraEffect';
import { useFormAutoFill } from '@/hooks/useFormAutoFill';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedResponse } from '@/types/form';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const features = [
  { icon: Zap, title: 'Siêu nhanh', desc: 'Gửi hàng trăm form trong vài phút' },
  { icon: Shield, title: 'An toàn', desc: 'Không yêu cầu đăng nhập Google' },
  { icon: Clock, title: 'Tự động', desc: 'Chỉ cần dán link, hệ thống lo tất cả' },
];

const Index = () => {
  const {
    formUrl,
    setFormUrl,
    fields,
    generatedResponses,
    setGeneratedResponses,
    status,
    isFetching,
    analyzeForm,
    startSubmitting,
    pauseSubmitting,
    resumeSubmitting,
    stopSubmitting,
    reset,
  } = useFormAutoFill();

  const { user, profile, wallet, logout, refreshWallet } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.functions.invoke('orders', {
          body: { action: 'get_public_settings' },
        });
        if (data?.settings) setSettings(data.settings);
      } catch {}
    };
    loadSettings();
  }, []);

  const handleManualResponsesReady = (responses: GeneratedResponse[]) => {
    setGeneratedResponses(responses);
  };

  const handleAnalyze = () => {
    if (!user) {
      toast({ title: 'Cần đăng nhập', description: 'Vui lòng đăng nhập để sử dụng', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (user.status === 'blocked') {
      toast({ title: 'Tài khoản bị khóa', description: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.', variant: 'destructive' });
      return;
    }
    analyzeForm();
  };

  const handleStartSubmitting = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.status === 'blocked') {
      toast({ title: 'Tài khoản bị khóa', description: 'Tài khoản của bạn đã bị khóa.', variant: 'destructive' });
      return;
    }
    if (!wallet || wallet.form_balance < 1) {
      toast({ title: 'Không đủ lượt', description: 'Vui lòng nạp thêm lượt.', variant: 'destructive' });
      return;
    }
    startSubmitting(user.user_id);
  };

  const handleResume = () => { if (user) resumeSubmitting(user.user_id); };
  const handleStop = async () => { stopSubmitting(); if (user) await refreshWallet(); };
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
      <SakuraEffect />
      
      {/* Mesh gradient background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="orb orb-primary w-[600px] h-[600px] -top-60 -right-60 animate-float" />
      <div className="orb orb-secondary w-[500px] h-[500px] top-1/3 -left-60 animate-float" style={{ animationDelay: '-2s' }} />
      <div className="orb orb-accent w-[400px] h-[400px] bottom-20 right-10 animate-float" style={{ animationDelay: '-4s' }} />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/30 glass">
        <div className="container max-w-5xl flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-gradient text-base tracking-tight">AutoFill</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full gradient-hero text-primary-foreground text-xs font-bold shadow-glow-sm">
                  <Zap className="h-3.5 w-3.5" />
                  {wallet?.form_balance ?? 0} lượt
                </div>
                <div className="relative">
                  {/* Mũi tên nhấp nháy chỉ vào hồ sơ */}
                  <div className="absolute -bottom-12 -right-2 z-50 animate-bounce">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-purple-600 mx-auto"></div>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg mt-1">
                      <ArrowRight className="h-3 w-3 animate-pulse" />
                      <span>Hồ sơ ở đây!</span>
                    </div>
                  </div>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl text-xs gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 hover:border-purple-500 hover:from-purple-100 hover:to-pink-100 font-bold px-4 py-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        onClick={() => navigate('/dashboard')}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">👤 Hồ sơ</span>
                          <span className="text-xs text-purple-600 leading-tight">{profile?.full_name || user.email?.split('@')[0]}</span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>👆 Bấm vào để xem hồ sơ & dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {user.role === 'ADMIN' && (
                  <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1" onClick={() => navigate('/admin')}>
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="rounded-xl text-xs text-destructive gap-1" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Button size="sm" className="rounded-xl gradient-primary text-primary-foreground text-xs font-bold px-5 shadow-glow-sm" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="container max-w-5xl relative z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass shadow-soft text-sm font-medium">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="text-foreground">Tool #1 Việt Nam</span>
              <span className="w-2 h-2 rounded-full gradient-primary animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.9]">
              <span className="text-foreground">Auto Fill</span>
              <br />
              <span className="text-gradient-hero">Google Form</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Chỉ cần dán link — hệ thống tự động phân tích câu hỏi,
              tạo câu trả lời và gửi hàng loạt.
            </p>

            {!user && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button size="lg" className="rounded-2xl gradient-primary text-primary-foreground font-bold px-8 h-14 text-base shadow-glow hover:shadow-glow transition-shadow gap-2" onClick={() => navigate('/login')}>
                  Bắt đầu miễn phí <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-strong text-sm font-medium hover-lift cursor-default">
                  <f.icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{f.title}</span>
                  <span className="text-muted-foreground hidden sm:inline">— {f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl pb-12 relative z-10 px-4">
        <Card className="glass-strong shadow-elevated border-0 p-0 overflow-hidden rounded-3xl">
          <div className="h-1 gradient-hero" />
          
          <div className="p-6 md:p-10 space-y-8">
            <FormSetupGuide />

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Step 1 */}
            <section className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="step-number gradient-primary text-primary-foreground w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shadow-glow-sm">1</div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold">Dán link Google Form</h2>
                  <p className="text-sm text-muted-foreground">Hệ thống tự động tải và phân tích câu hỏi</p>
                </div>
              </div>
              <div className="space-y-4 pl-0 md:pl-[60px]">
                <FormUrlInput value={formUrl} onChange={setFormUrl} />
                <Button
                  onClick={handleAnalyze}
                  disabled={isFetching || !formUrl.trim()}
                  className="w-full h-13 gap-3 font-bold text-base rounded-2xl gradient-primary text-primary-foreground hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-glow disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tải và phân tích...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Phân tích Form
                    </>
                  )}
                </Button>
              </div>
            </section>

            {fields.length > 0 && (
              <>
                <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                <section className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="step-number gradient-secondary text-secondary-foreground w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shadow-glow-sm">2</div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                        Tạo câu trả lời <Shuffle className="h-5 w-5 text-secondary" />
                      </h2>
                      <p className="text-sm text-muted-foreground">Thiết lập tỉ lệ và tạo câu trả lời ngẫu nhiên</p>
                    </div>
                  </div>
                  <div className="space-y-6 pl-0 md:pl-[60px]">
                    <FieldsList fields={fields} />
                    <RandomResponseGenerator fields={fields} onResponsesReady={handleManualResponsesReady} maxCount={wallet?.form_balance} />
                  </div>
                </section>
              </>
            )}

            {generatedResponses.length > 0 && (
              <>
                <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                <section className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="step-number gradient-accent text-accent-foreground w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold shadow-glow-sm">3</div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                        Xem trước & Gửi <Send className="h-5 w-5 text-accent" />
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Kiểm tra và gửi • Cần <span className="font-bold text-primary">{generatedResponses.length} lượt</span>
                        {wallet && <span> (còn {wallet.form_balance} lượt)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6 pl-0 md:pl-[60px]">
                    <ResponsePreview responses={generatedResponses} fields={fields} />
                    <SubmitProgress
                      status={status}
                      responsesCount={generatedResponses.length}
                      onStart={handleStartSubmitting}
                      onPause={pauseSubmitting}
                      onResume={handleResume}
                      onStop={handleStop}
                      onReset={reset}
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        </Card>

        {/* Contact / Credits Section */}
        <section className="mt-16 mb-8 relative z-30">
          <Card className="overflow-hidden border-0 rounded-3xl shadow-elevated">
            <div className="gradient-hero p-[1px] rounded-3xl">
              <div className="glass-strong rounded-3xl p-8 md:p-12">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    <Sparkles className="h-4 w-4" />
                    Liên hệ & Hỗ trợ
                  </div>
                  
                  <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                    Được phát triển bởi{' '}
                    <span className="text-gradient-hero">Tuấn và Quân</span>
                  </h2>
                  
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Cần hỗ trợ hoặc muốn tìm hiểu thêm? Liên hệ ngay qua các kênh bên dưới.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                      href="https://www.facebook.com/tuanvaquan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-[hsl(220,46%,48%)] text-white font-bold text-base hover:bg-[hsl(220,46%,42%)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                    >
                      <Facebook className="h-5 w-5" />
                      Facebook
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                    <a
                      href="https://www.youtube.com/@tuanvaquanfptu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-destructive text-destructive-foreground font-bold text-base hover:bg-destructive/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                    >
                      <Youtube className="h-5 w-5" />
                      YouTube
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <p className="text-center text-xs text-muted-foreground/60 pb-4">
          © 2024 AutoFill Tool — Tuấn và Quân
        </p>
      </main>
      </div>
    </TooltipProvider>
  );
};

export default Index;
