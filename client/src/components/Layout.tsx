import { type ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Wallet, 
  LogOut, 
  Menu,
  X,
  Target,
  Repeat,
  Settings,
  ChevronRight
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
    { id: 'budget', label: 'Budgets & Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'categories', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item, onClick }: any) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium group relative overflow-hidden ${
          isActive 
            ? 'text-white shadow-lg shadow-blue-500/30' 
            : 'text-stone-500 hover:bg-white hover:text-blue-600'
        }`}
      >
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl -z-10" />
        )}
        
        <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-blue-500'}`} />
        <span className="flex-1 text-left">{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      
      <aside className="hidden md:flex flex-col w-72 fixed h-full z-20 pl-4 py-4">
        <div className="h-full bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-indigo-100/50 flex flex-col">
            
            {/* Header */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 text-white">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 tracking-tight">FinTrack</h1>
                      <p className="text-xs text-blue-500 font-bold tracking-wide uppercase">Premium</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              {menuItems.map((item) => (
                <NavItem key={item.id} item={item} onClick={() => setActiveTab(item.id)} />
              ))}
            </nav>

            {/* Profile */}
            <div className="p-4 mt-auto">
               <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-white shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                   </div>
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-500 bg-white hover:bg-rose-50 rounded-xl transition-colors text-sm font-bold border border-rose-100"
                   >
                     <LogOut className="w-4 h-4" /> Sign Out
                   </button>
               </div>
            </div>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed w-full bg-white/90 backdrop-blur-lg z-30 px-5 py-3 flex justify-between items-center border-b border-slate-200 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
                <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">FinTrack</span>
         </div>
         <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2.5 text-slate-600 bg-slate-100 rounded-xl active:scale-95 transition-transform"
         >
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
           
           {/* Menu Drawer */}
           <div className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
              </div>
              
              <nav className="space-y-2 flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavItem 
                        key={item.id} 
                        item={item} 
                        onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                        }} 
                    />
                ))}
              </nav>

              <button 
                onClick={handleLogout} 
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-rose-600 font-bold bg-rose-50 rounded-2xl"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
           </div>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 md:ml-80 p-5 md:p-8 mt-16 md:mt-0 transition-all duration-300">
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;