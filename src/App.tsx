import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import TopUp from "./pages/dashboard/TopUp";
import UserOrders from "./pages/dashboard/UserOrders";
import FormHistory from "./pages/dashboard/FormHistory";
import Transactions from "./pages/dashboard/Transactions";
import Profile from "./pages/dashboard/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminFormHistory from "./pages/admin/AdminFormHistory";
import AdminSettings from "./pages/admin/AdminSettings";
import SakuraEffect from "./components/SakuraEffect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <SakuraEffect />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              <Route path="topup" element={<TopUp />} />
              <Route path="orders" element={<UserOrders />} />
              <Route path="history" element={<FormHistory />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Protected admin routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AppLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="form-history" element={<AdminFormHistory />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
