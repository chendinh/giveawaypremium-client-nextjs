'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  PieChart,
  Monitor,
  Package,
  Mail,
  Terminal,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

import Consignment from './components/Consignment';
import ManageScreen from './components/ManageScreen';
import SettingScreen from './components/SettingScreen';
import SaleScreen from './components/SaleScreen';
import SummaryScreen from './components/SummaryScreen';
import NoteScreen from './components/NoteScreen';

import './style.scss';

// ── Types ──
interface MenuItemType {
  key: number;
  icon: React.ReactNode;
  label: string;
  isFullScreen: boolean;
  /** key trong AdminNotificationCounts để hiển thị badge */
  notifKey?: 'pendingAppointments' | 'pendingOrders' | 'pendingPayouts';
}

const menuItems: MenuItemType[] = [
  {
    key: 1,
    icon: <PieChart className="h-5 w-5" />,
    label: 'Thống Kê',
    isFullScreen: true,
  },
  {
    key: 2,
    icon: <Monitor className="h-5 w-5" />,
    label: 'Ghi Chú',
    isFullScreen: false,
  },
  {
    key: 3,
    icon: <Package className="h-5 w-5" />,
    label: 'Quản lý',
    isFullScreen: true,
  },
  {
    key: 4,
    icon: <Mail className="h-5 w-5" />,
    label: 'Ký gửi',
    isFullScreen: false,
    notifKey: 'pendingPayouts',
  },
  {
    key: 5,
    icon: <Terminal className="h-5 w-5" />,
    label: 'Bán hàng',
    isFullScreen: true,
  },
  {
    key: 6,
    icon: <Settings className="h-5 w-5" />,
    label: 'Cài đặt',
    isFullScreen: false,
  },
];

// ── Component ──
const DashBoard: React.FC = () => {
  const {
    login,
    logout,
    userData,
    isAuthenticated,
    setCategoryRedux,
    setUnitAddressRedux,
    setEventsRedux,
    fetchSettings,
  } = useAppStore();

  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);
  const [numberPage, setNumberPage] = useState<number>(4);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const { counts: notifCounts, refresh: refreshNotifs } =
    useAdminNotifications(isLogin);

  // ── Check signed ──
  const checkIsSigned = useCallback(() => {
    if (userData?.sessionToken || isAuthenticated) {
      setIsLogin(true);
      setIsLoadingLogin(false);
      setShowLoginDialog(false);
    } else if (!isLogin) {
      setShowLoginDialog(true);
    }
  }, [userData, isAuthenticated, isLogin]);

  useEffect(() => {
    checkIsSigned();
  }, [checkIsSigned]);

  // ── Fetch initial data ──
  useEffect(() => {
    if (!isLogin) return;
    const fetchInitialData = async () => {
      try {
        await fetchSettings();
        const categoryRes = await GapService.getCategory();
        if (categoryRes?.results) setCategoryRedux(categoryRes.results);
        const unitAddressRes = await GapService.getUnitAddress();
        if (unitAddressRes?.result) setUnitAddressRedux(unitAddressRes.result);
        const eventsRes = await GapService.getEvents();
        if (eventsRes?.results) setEventsRedux(eventsRes.results);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  // ── Login ──
  const onFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error('Vui lòng nhập tên tài khoản và mật khẩu');
      return;
    }
    setIsLoadingLogin(true);
    try {
      const result = await GapService.logInAdmin(
        loginForm.username,
        loginForm.password
      );
      if (result?.sessionToken) {
        GapService.updateIPHASH({ userData: result });
        login(result, result.sessionToken);
        toast.success('Đăng nhập thành công');
        setIsLogin(true);
        setIsLoadingLogin(false);
        setShowLoginDialog(false);
        setLoginForm({ username: '', password: '' });
      } else {
        toast.error('Đăng nhập thất bại');
        setIsLoadingLogin(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Đăng nhập thất bại');
      setIsLoadingLogin(false);
    }
  };

  const handleSignOut = () => {
    logout();
    setIsLogin(false);
    setShowLoginDialog(true);
    toast.success('Đã đăng xuất');
  };

  const handleChoosePage = (item: MenuItemType) => {
    setNumberPage(item.key);
    setIsFullScreen(item.isFullScreen);
    // Khi vào tab có badge → refresh để cập nhật count
    if (item.notifKey) refreshNotifs();
  };

  const renderContent = () => {
    switch (numberPage) {
      case 1:
        return <SummaryScreen />;
      case 2:
        return <NoteScreen />;
      case 3:
        return <ManageScreen />;
      case 4:
        return <Consignment />;
      case 5:
        return <SaleScreen />;
      case 6:
        return <SettingScreen />;
      default:
        return <Consignment />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* ── Login Dialog ── */}
      <Dialog open={showLoginDialog} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center">Đăng nhập</DialogTitle>
          </DialogHeader>
          <form onSubmit={onFinish} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tài khoản</Label>
              <Input
                id="username"
                value={loginForm.username}
                onChange={e =>
                  setLoginForm(prev => ({ ...prev, username: e.target.value }))
                }
                placeholder="Nhập tên tài khoản..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={e =>
                  setLoginForm(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder="Nhập mật khẩu..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoadingLogin}>
              {isLoadingLogin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng
                  nhập...
                </>
              ) : (
                'OK'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dashboard ── */}
      <div className="dashboard-container-wrapper">
        {/* ── Sidebar ── */}
        <div
          className={cn(
            'sider-container',
            sidebarCollapsed && 'sider-collapsed'
          )}
        >
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Image
                src="/images/Icon/ALogoWhite.svg"
                alt="GA"
                width={32}
                height={32}
              />
            </div>
            {!sidebarCollapsed && (
              <span className="sidebar-logo-text">
                <Image
                  src="/images/Icon/giveawayTextWhite.svg"
                  alt="GiveAway"
                  width={70}
                  height={15}
                />
              </span>
            )}
          </div>

          <div className="sidebar-divider" />

          {/* Nav */}
          <nav className="sidebar-nav">
            {menuItems.map(item => {
              const badgeCount = item.notifKey ? notifCounts[item.notifKey] : 0;
              return (
                <button
                  key={item.key}
                  title={item.label}
                  onClick={() => handleChoosePage(item)}
                  className={cn(
                    'sidebar-nav-btn',
                    numberPage === item.key && 'sidebar-nav-btn--active'
                  )}
                >
                  <span className="sidebar-nav-icon relative">
                    {item.icon}
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                  {!sidebarCollapsed && badgeCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="sidebar-bottom">
            <div className="sidebar-divider" />
            <button
              title="Đăng xuất"
              onClick={handleSignOut}
              className="sidebar-nav-btn sidebar-nav-btn--logout"
            >
              <span className="sidebar-nav-icon">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="sidebar-label">Đăng xuất</span>
            </button>
          </div>

          {/* Toggle tab — gắn vào mép phải sidebar */}
          <button
            title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="sidebar-toggle-tab"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* ── Content ── */}
        <div
          className="dashboard-content"
          style={isFullScreen ? { maxWidth: 'calc(100vw - 100px)' } : {}}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
