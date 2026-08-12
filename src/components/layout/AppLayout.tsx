import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, CreditCard, History, Clock, User, LogOut, Shield, Users, FileText,
  Sparkles, Zap, ChevronLeft, Menu, TrendingUp, Settings, BookOpen, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const userMenuItems = [
  { title: 'Tổng quan', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Nạp lượt', url: '/dashboard/topup', icon: CreditCard },
  { title: 'Đơn nạp', url: '/dashboard/orders', icon: FileText },
  { title: 'Lịch sử dùng tool', url: '/dashboard/history', icon: Clock },
  { title: 'Giao dịch', url: '/dashboard/transactions', icon: TrendingUp },
  { title: 'Hồ sơ', url: '/dashboard/profile', icon: User },
];

const adminMenuItems = [
  { title: 'Thống kê', url: '/admin', icon: Shield },
  { title: 'Quản lý đơn', url: '/admin/orders', icon: CreditCard },
  { title: 'Người dùng', url: '/admin/users', icon: Users },
  { title: 'Quản lý ví', url: '/admin/wallets', icon: Wallet },
  { title: 'Giao dịch', url: '/admin/transactions', icon: TrendingUp },
  { title: 'Lịch sử tool', url: '/admin/form-history', icon: BookOpen },
  { title: 'Cài đặt', url: '/admin/settings', icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, wallet } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="gradient-mesh">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-extrabold text-gradient text-lg">AutoFill</span>}
        </div>

        {/* Balance */}
        {!collapsed && wallet && (
          <div className="mx-3 mb-2 p-3 rounded-xl glass-strong">
            <p className="text-xs text-muted-foreground">Số dư</p>
            <p className="text-xl font-extrabold text-primary">{wallet.form_balance}</p>
            <p className="text-xs text-muted-foreground">lượt còn lại</p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {!collapsed && 'Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-muted/50 rounded-lg transition-colors"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === 'ADMIN' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {!collapsed && 'Quản trị'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className="hover:bg-muted/50 rounded-lg transition-colors"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4 mr-2 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tool link */}
        <div className="mt-auto p-3 relative">
          {/* Mũi tên nhấp nháy chỉ vào nút tool */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-amber-600 mx-auto"></div>
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg mt-1">
              <span>Dùng Tool!</span>
              <ArrowRight className="h-3 w-3 animate-pulse" />
            </div>
          </div>
          
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/" className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-4 border-2 border-amber-400 hover:border-orange-500 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all hover:scale-105 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="text-base font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">🚀 Dùng Tool</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppLayout() {
  const { user, profile, wallet, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top navbar */}
            <header className="h-14 border-b border-border/50 glass flex items-center justify-between px-4 sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Zap className="h-3 w-3" />
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
                        onClick={() => navigate('/dashboard/profile')}
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
                      <p>👆 Bấm vào để xem hồ sơ cá nhân</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg text-xs text-destructive gap-1" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
