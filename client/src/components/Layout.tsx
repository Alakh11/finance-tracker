import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  LogOut,
  Menu,
  X,
  Target,
  ChevronRight,
  Settings,
  Repeat
} from 'lucide-react';
import type { User } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}

const Layout = ({ children, user, activeTab, setActiveTab, handleLogout }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Wallet },
    { id: 'recurring', label: 'Recurring Bills', icon: Repeat },
    { id: 'budget', label: 'Budgets', icon: Target },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'categories', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item, onClick }: any) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-medium group ${isActive
            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-stone-100'
            : 'text-stone-500 hover:bg-white/60 hover:text-stone-700'
          }`}
      >
        <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-500' : 'text-stone-400'}`} />
        <span className="flex-1 text-left">{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 text-blue-300" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAF9]">
      {/* --- Sidebar (Floating Style) --- */}
      <aside className="hidden md:flex flex-col w-72 fixed h-full z-20 pl-4 py-4">
        <div className="h-full bg-[#F5F5F4] rounded-[2rem] border border-white shadow-xl shadow-stone-200/50 flex flex-col">

          {/* Header */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200/50 rotate-3 hover:rotate-6 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-800 tracking-tight">FinTrack</h1>
                <p className="text-xs text-stone-400 font-medium tracking-wide">Premium Finance</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {menuItems.map((item) => (
              <NavItem key={item.id} item={item} onClick={() => setActiveTab(item.id)} />
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 mt-auto">
            <div className="bg-white p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-stone-50 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-stone-50" />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-stone-700 truncate">{user.name}</p>
                  <p className="text-xs text-stone-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed w-full bg-[#FAFAF9]/90 backdrop-blur-md z-30 px-6 py-4 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-stone-800 text-lg">FinTrack</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 hover:bg-white rounded-xl shadow-sm">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- Main Content Area (Centered) --- */}
      <main className="flex-1 md:ml-80 p-6 md:p-10 mt-20 md:mt-0 transition-all duration-300">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;