import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Copy, 
  Check, 
  ArrowRight, 
  Play, 
  Upload, 
  FileText, 
  Settings, 
  CreditCard,
  Shield,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Guide = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "Bước 1: Nạp lượt sử dụng",
      description: "Nạp tiền để có lượt sử dụng tool",
      icon: CreditCard,
      color: "from-green-500 to-emerald-600",
      action: () => navigate('/dashboard/topup'),
      buttonText: "Nạp ngay"
    },
    {
      id: 2,
      title: "Bước 2: Chuẩn bị file Excel",
      description: "Chuẩn bị file Excel với các cột thông tin cần điền",
      icon: FileText,
      color: "from-blue-500 to-cyan-600",
      details: [
        "Cột A: Tên",
        "Cột B: Email", 
        "Cột C: Số điện thoại",
        "Cột D: Địa chỉ",
        "Và các thông tin khác cần thiết"
      ]
    },
    {
      id: 3,
      title: "Bước 3: Upload file Google Sheets",
      description: "Upload file Excel lên Google Sheets để lấy link",
      icon: Upload,
      color: "from-purple-500 to-pink-600",
      details: [
        "Mở Google Sheets",
        "File → Import → Upload",
        "Chọn file Excel đã chuẩn bị",
        "Share → Get link → Copy link"
      ]
    },
    {
      id: 4,
      title: "Bước 4: Dùng Tool Auto Fill",
      description: "Dán link Google Sheets vào tool và bắt đầu",
      icon: Zap,
      color: "from-amber-500 to-orange-600",
      action: () => navigate('/'),
      buttonText: "Dùng Tool ngay"
    }
  ];

  const features: Array<{
    icon: any;
    title: string;
    description: string;
    color: string;
  }> = [
    {
      icon: Shield,
      title: "An toàn tuyệt đối",
      description: "Không yêu cầu đăng nhập Google, bảo mật thông tin",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Clock,
      title: "Siêu tốc độ",
      description: "Điền hàng trăm form chỉ trong vài phút",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Settings,
      title: "Dễ sử dụng",
      description: "Giao diện thân thiện, chỉ cần 4 bước đơn giản",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('lequan12305@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="orb orb-primary w-[600px] h-[600px] -top-60 -right-60 animate-float" />
        <div className="orb orb-secondary w-[500px] h-[500px] top-1/3 -left-60 animate-float" style={{ animationDelay: '-2s' }} />
        <div className="orb orb-accent w-[400px] h-[400px] bottom-20 right-10 animate-float" style={{ animationDelay: '-4s' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="relative z-10 container max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong border border-white/20">
            <Play className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Video Hướng Dẫn</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white">
            Hướng Dẫn Sử Dụng <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Auto Fill Tool</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Đừng dùng tay điền form nữa! Hướng dẫn chi tiết 4 bước để sử dụng Auto Fill Tool hiệu quả nhất
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => window.open('https://youtu.be/Adb3X2ikUfg?si=l5I2hcfYVUY7wKNQ', '_blank')}
              className="gap-3 rounded-xl gradient-to-r from-red-600 to-pink-600 text-white font-bold shadow-glow-lg hover:scale-105 transition-all px-6 py-3 h-14 text-base"
            >
              <Play className="h-5 w-5" />
              <span>Xem Video Hướng Dẫn</span>
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="gap-3 rounded-xl gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-glow-lg hover:scale-105 transition-all px-6 py-3 h-14 text-base"
            >
              <Zap className="h-5 w-5" />
              <span>Dùng Tool Ngay</span>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="glass-strong border border-white/10 p-6 hover:scale-105 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-white mb-8">4 Bước Đơn Giản Để Sử Dụng</h2>
          
          {steps.map((step, index) => (
            <Card key={step.id} className="glass-strong border border-white/10 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className={`h-1 bg-gradient-to-r ${step.color}`}></div>
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0 shadow-glow-sm`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      <Badge className={`bg-gradient-to-r ${step.color} text-white border-none`}>
                        Bước {step.id}
                      </Badge>
                    </div>
                    
                    <p className="text-white/80 text-lg mb-4">{step.description}</p>
                    
                    {step.details && (
                      <div className="space-y-2 mb-6">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="h-4 w-4 text-amber-400" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {step.action && (
                      <Button 
                        onClick={step.action}
                        className={`gap-2 rounded-xl bg-gradient-to-r ${step.color} text-white font-bold hover:opacity-90 shadow-glow-sm hover:scale-105 transition-all`}
                      >
                        {step.buttonText}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card className="glass-strong border border-white/10 p-8 mb-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Mẹo Sử Dụng Hiệu Quả</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <p className="text-white font-semibold">Chuẩn bị dữ liệu chính xác</p>
                  <p className="text-white/70 text-sm">Đảm bảo file Excel có đủ các cột thông tin cần thiết</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <p className="text-white font-semibold">Kiểm tra link Google Sheets</p>
                  <p className="text-white/70 text-sm">Đảm bảo link có quyền truy cập công khai</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <p className="text-white font-semibold">Sử dụng mạng ổn định</p>
                  <p className="text-white/70 text-sm">Để tool hoạt động mượt mà không bị gián đoạn</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <p className="text-white font-semibold">Kiểm tra lại kết quả</p>
                  <p className="text-white/70 text-sm">Luôn kiểm tra lại thông tin sau khi điền form</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="glass-strong border border-white/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Cần Hỗ Trợ?</h2>
          <p className="text-white/70 mb-6">Liên hệ với chúng tôi để được hỗ trợ nhanh nhất</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleCopyEmail}
              className="gap-3 rounded-xl glass-strong border border-white/20 text-white hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Đã copy!' : 'lequan12305@gmail.com'}</span>
            </Button>
            
            <Button 
              onClick={() => window.open('https://www.facebook.com/tuanvaquan', '_blank')}
              className="gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:opacity-90"
            >
              <span>Facebook Support</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn Sàng Điền Form Tự Động?</h2>
          <p className="text-white/70 mb-6">Tiết kiệm thời gian, tăng hiệu suất với Auto Fill Tool</p>
          <Button 
            onClick={() => navigate('/')}
            className="gap-4 rounded-xl gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-glow-lg hover:scale-110 transition-all px-8 py-4 h-16 text-lg"
          >
            <Zap className="h-6 w-6" />
            <span>Bắt Đầu Sử Dụng Ngay</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Guide;
