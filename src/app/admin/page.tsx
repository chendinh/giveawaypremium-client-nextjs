'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

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
    userData,
    login,
    logout,
    isAuthenticated,
    categoryRedux,
    setCategoryRedux,
    setUnitAddressRedux,
    fetchSettings,
  } = useAppStore();

  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);
  const [numberPage, setNumberPage] = useState<number>(4);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

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

  // ── Fetch initial data (category + unitAddress + settings) ──
  useEffect(() => {
    if (!isLogin) return;

    const fetchInitialData = async () => {
      try {
        await fetchSettings();

        const categoryRes = await GapService.getCategory();
        if (categoryRes?.results) {
          setCategoryRedux(categoryRes.results);
        }

        const unitAddressRes = await GapService.getUnitAddress();
        if (unitAddressRes?.result) {
          setUnitAddressRedux(unitAddressRes.result);
        }
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

  // ── Page navigation ──
  const handleChoosePage = (item: MenuItemType) => {
    setNumberPage(item.key);
    setIsFullScreen(item.isFullScreen);
  };

  // ── Content render ──
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
      {/* Login Dialog */}
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

      {/* Dashboard */}
      <div className="dashboard-container-wrapper">
        {/* Sidebar */}
        <div className={cn('sider-container', isFullScreen && 'collapsed')}>
          <nav className="flex flex-col gap-1">
            {menuItems.map(item => (
              <button
                key={item.key}
                title={item.label}
                onClick={() => handleChoosePage(item)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] transition-colors',
                  'hover:bg-gray-600/60 hover:text-white',
                  numberPage === item.key
                    ? 'bg-gray-600/80 text-white'
                    : 'text-gray-400'
                )}
              >
                {item.icon}
                <span className="sidebar-label">
                  {item.label}
                </span>
              </button>
            ))}

            {/* Sign out */}
            <button
              title="Đăng xuất"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] text-gray-400 transition-colors hover:bg-gray-600/60 hover:text-white mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span className="sidebar-label">
                Đăng xuất
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div
          className={cn('dashboard-content', isFullScreen && 'fullscreen')}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
