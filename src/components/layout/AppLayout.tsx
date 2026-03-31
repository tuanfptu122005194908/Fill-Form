import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, CreditCard, History, Clock, User, LogOut, Shield, Users, FileText,
  Sparkles, Zap, ChevronLeft, Menu, TrendingUp, Settings, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';

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
        <div className="mt-auto p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/" className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-2">
                  <Zap className="h-4 w-4 shrink-0 text-accent" />
                  {!collapsed && <span className="text-sm font-medium">Dùng Tool</span>}
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
              <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{profile?.full_name || user.email}</span>
              </Button>
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
  );
}
