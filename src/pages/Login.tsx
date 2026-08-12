import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegister && !name.trim()) return;

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
        toast({ title: 'Đăng ký thành công!', description: 'Bạn được tặng 5 lượt dùng miễn phí.' });
      } else {
        await login(email, password);
        toast({ title: 'Đăng nhập thành công!' });
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh relative overflow-hidden flex items-center justify-center p-4">
      <div className="orb orb-primary w-[500px] h-[500px] -top-40 -right-40 animate-float" />
      <div className="orb orb-secondary w-[400px] h-[400px] bottom-20 -left-40 animate-float" style={{ animationDelay: '-2s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold">
            <span className="text-gradient-hero">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRegister ? 'Đăng ký để sử dụng Auto Fill Form' : 'Chào mừng bạn quay trở lại'}
          </p>
        </div>

        <Card className="glass-strong shadow-elevated border-0 p-0 overflow-hidden animate-fade-in-up">
          <div className="h-1.5 gradient-hero" />
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Họ tên</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="h-12 pl-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-12 pl-11 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 pl-11 pr-12 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-13 gap-2 font-bold text-base rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Đăng ký' : 'Đăng nhập'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                <span className="font-semibold text-primary">{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
