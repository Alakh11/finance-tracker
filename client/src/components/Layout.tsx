import { useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { 
  LayoutDashboard, PieChart, Wallet, LogOut, Menu, X, Target, Repeat, Settings, ChevronRight, Trophy 
} from 'lucide-react';
import icon from '../assets/iconNew.png';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const router = useRouter();
  const { user, handleLogout } = router.options.context; 

  const menuItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Wallet },
    { to: '/recurring', label: 'Recurring Bills', icon: Repeat },
    { to: '/budget', label: 'Budgets', icon: Target },
    { to: '/goals', label: 'Savings Goals', icon: Trophy },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/categories', label: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item, onClick }: any) => {
    return (
      <Link
        to={item.to}
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium group relative overflow-hidden text-stone-500 hover:bg-white hover:text-blue-600"
        activeProps={{
            className: "!bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white shadow-lg shadow-blue-500/30"
        }}
      >
        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight className="w-4 h-4 opacity-0 group-[.active]:opacity-100 text-white/70" />
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 fixed h-full z-30 pl-4 py-4">
        <div className="h-full bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-indigo-100/50 flex flex-col">
            <div className="p-8 pb-4 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-xl shadow-lg">
                    <img src={icon} className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">FinTrack</h1>
                    <p className="text-xs text-blue-500 font-bold uppercase">Premium</p>
                </div>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
              {menuItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </nav>
            <div className="p-4 mt-auto">
               <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-white shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <img src={user.picture || "https://ui-avatars.com/api/?name=" + user.name} alt="Profile" className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                   </div>
                   <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-500 bg-white hover:bg-rose-50 rounded-xl font-bold border border-rose-100">
                     <LogOut className="w-4 h-4" /> Sign Out
                   </button>
               </div>
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-lg z-50 px-5 py-3 flex justify-between items-center border-b border-slate-200 shadow-sm">
         <div className="flex items-center gap-2">
             <div className="p-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-lg shadow-lg">
                <img src={icon} className="w-6 h-6" />
             </div>
            <span className="font-bold text-slate-800 text-lg">FinTrack</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2.5 bg-slate-100 rounded-xl"><Menu className="w-6 h-6" /></button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="absolute right-0 top-0 h-full w-[85%] max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <img src={user.picture || "https://ui-avatars.com/api/?name=" + user.name} className="w-12 h-12 rounded-full" />
                  <div><p className="text-sm font-bold text-slate-800">{user.name}</p><p className="text-xs text-slate-500 truncate">{user.email}</p></div>
              </div>
              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                    <NavItem key={item.to} item={item} onClick={() => setIsMobileMenuOpen(false)} />
                ))}
              </nav>
              <button onClick={handleLogout} className="mt-6 w-full py-3.5 text-rose-600 font-bold bg-rose-50 rounded-2xl flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign Out
              </button>
           </div>
        </div>
      )}

      <main className="flex-1 md:ml-80 p-5 md:p-8 mt-20 md:mt-0 transition-all duration-300 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;