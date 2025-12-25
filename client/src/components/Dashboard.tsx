import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, 
  CreditCard,
} from 'lucide-react';
import type { User, Transaction, DashboardStats } from '../types';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, amount, icon: Icon,  }: any) => {
//   const styles = {
//     balance: { bg: 'bg-stone-800', iconBg: 'bg-stone-700', text: 'text-white', sub: 'text-stone-400' },
//     income: { bg: 'bg-white', iconBg: 'bg-[#F0FDF4]', text: 'text-stone-800', sub: 'text-stone-400', iconColor: 'text-emerald-600' },
//     expense: { bg: 'bg-white', iconBg: 'bg-[#FEF2F2]', text: 'text-stone-800', sub: 'text-stone-400', iconColor: 'text-rose-600' },
//   }[type as 'balance' | 'income' | 'expense'];

  return (
    <div className={` p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50 hover:-translate-y-1 transition-transform duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={` text-sm font-medium mb-2`}>{title}</p>
          <h3 className={` text-3xl font-bold tracking-tight`}>
            ₹{amount.toLocaleString('en-IN')}
          </h3>
        </div>
        <div className={`p-3.5 rounded-2xl`}>
          <Icon className={`w-6 h-6  || 'text-white'}`} />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [newTx, setNewTx] = useState({ 
    amount: '', 
    type: 'expense', 
    note: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const API_URL = "https://finance-tracker-q60v.onrender.com";

  useEffect(() => {
    fetchDashboard();
  }, [user.email]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/${user.email}`);
      const totals = res.data.totals || [];
      let inc = 0, exp = 0;
      totals.forEach((t: any) => {
        if(t.type === 'income') inc = Number(t.total);
        if(t.type === 'expense') exp = Number(t.total);
      });
      setStats({ income: inc, expense: exp, balance: inc - exp });
      setTransactions(res.data.recent || []);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const addTransaction = async () => {
    if (!newTx.amount) return;
    try {
      await axios.post(`${API_URL}/transactions`, {
        user_email: user.email,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: "General", 
        payment_mode: "UPI",
        date: newTx.date,
        note: newTx.note
      });
      setNewTx({ ...newTx, amount: '', note: '' }); // Clear form
      fetchDashboard(); // Refresh data
    } catch (err) {
      console.error("Failed to add", err);
      alert("Error adding transaction.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Balance" amount={stats.balance} icon={Wallet} color="bg-blue-600" />
        <StatCard title="Monthly Income" amount={stats.income} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Monthly Expense" amount={stats.expense} icon={TrendingDown} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Transaction Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Plus className="w-5 h-5 text-blue-600" /> Quick Add
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setNewTx({...newTx, type: 'income'})}
                className={`p-2 rounded-lg text-sm font-medium transition ${newTx.type === 'income' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Income
              </button>
              <button 
                 onClick={() => setNewTx({...newTx, type: 'expense'})}
                 className={`p-2 rounded-lg text-sm font-medium transition ${newTx.type === 'expense' ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Expense
              </button>
            </div>
            <input 
              type="number" 
              placeholder="Amount (₹)" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={newTx.amount}
              onChange={e => setNewTx({...newTx, amount: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Note (e.g. Lunch)" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={newTx.note}
              onChange={e => setNewTx({...newTx, note: e.target.value})}
            />
            <input 
              type="date" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              value={newTx.date}
              onChange={e => setNewTx({...newTx, date: e.target.value})}
            />
            <button 
              onClick={addTransaction}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition"
            >
              Save Transaction
            </button>
          </div>
        </div>

        {/* Right Column: Recent Transactions List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Recent Transactions</h2>
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tx.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    <CreditCard className={`w-5 h-5 ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tx.note || tx.category}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'} ₹{tx.amount}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-400">No transactions yet.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}