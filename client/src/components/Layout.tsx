import type { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Wallet, 
  LogOut, 
  Menu,
  X,
  Target,
  Repeat
} from 'lucide-react';
import { useState } from 'react';

// --- Types ---
interface User {
  name: string;
  email: string;
  picture: string;
}

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'budget', label: 'Budget & Goals', icon: Target },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">FinTrack</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
           >
             <LogOut className="w-5 h-5" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed w-full bg-white z-20 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800">FinTrack</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* --- Mobile Menu Overlay --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="bg-white w-64 h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="mb-8 font-bold text-xl px-2">Menu</div>
              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                        activeTab === item.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    </button>
                ))}
              </nav>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
           </div>
        </div>
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-14 md:mt-0 transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
                <p className="text-gray-500 text-sm">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm w-fit">
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-gray-100"
                />
                <span className="text-sm font-medium text-gray-700 pr-2 hidden sm:block">
                    {user.email}
                </span>
            </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default Layout;