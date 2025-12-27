import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wallet, TrendingUp, TrendingDown, Plus,
  CreditCard, Calendar, CheckCircle2, RefreshCw, AlertTriangle
} from 'lucide-react';
import type { User, Transaction, DashboardStats } from '../types';

interface DashboardProps {
  user: User;
}

const StatCard = ({ title, amount, icon: Icon, type, isLoading }: any) => {
  const styles = {
    balance: { bg: 'bg-gradient-to-br from-blue-600 to-indigo-700', text: 'text-white', sub: 'text-blue-100', icon: 'bg-white/20 text-white' },
    income: { bg: 'bg-white', text: 'text-slate-800', sub: 'text-slate-400', icon: 'bg-emerald-100 text-emerald-600' },
    expense: { bg: 'bg-white', text: 'text-slate-800', sub: 'text-slate-400', icon: 'bg-rose-100 text-rose-600' },
  }[type as 'balance' | 'income' | 'expense'];

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-40 animate-pulse flex flex-col justify-between">
        <div className="h-4 w-24 bg-slate-100 rounded-lg"></div>
        <div className="flex justify-between items-end">
            <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
            <div className="h-12 w-12 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.bg} p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className={`${styles.sub} text-sm font-bold mb-2 uppercase tracking-wide`}>{title}</p>
          <h3 className={`${styles.text} text-3xl font-extrabold tracking-tight`}>₹{amount.toLocaleString('en-IN')}</h3>
        </div>
        <div className={`p-4 rounded-2xl ${styles.icon}`}><Icon className="w-6 h-6" /></div>
      </div>
    </div>
  );
};

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTx, setNewTx] = useState({
    amount: '',
    type: 'expense',
    note: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  const API_URL = "https://finance-tracker-q60v.onrender.com";

  useEffect(() => {
    fetchDashboard();
    axios.get(`${API_URL}/categories/${user.email}`).then(res => setCategories(res.data));
  }, [user.email]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/dashboard/${user.email}`);
      const totals = res.data.totals || [];
      let inc = 0, exp = 0;
      totals.forEach((t: any) => {
        if (t.type === 'income') inc = Number(t.total);
        if (t.type === 'expense') exp = Number(t.total);
      });
      setStats({ income: inc, expense: exp, balance: inc - exp });
      setTransactions(res.data.recent || []);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Server is waking up. Please retry in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!newTx.amount || !selectedCategory) {
        alert("Please select a category and amount");
        return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/transactions`, {
        user_email: user.email,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: selectedCategory,
        payment_mode: "UPI",
        date: newTx.date,
        note: newTx.note,
        is_recurring: newTx.is_recurring
      });
      setNewTx({ ...newTx, amount: '', note: '' });
      fetchDashboard(); 
    } catch (err) {
      alert("Error adding transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCats = categories.filter(c => c.type === newTx.type);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between text-rose-700 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-200 rounded-full"><AlertTriangle className="w-5 h-5 text-rose-700" /></div>
                <span className="font-semibold">{error}</span>
            </div>
            <button 
                onClick={fetchDashboard}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-200"
            >
                Retry Connection
            </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Balance" amount={stats.balance} icon={Wallet} type="balance" isLoading={isLoading} />
        <StatCard title="Total Income" amount={stats.income} icon={TrendingUp} type="income" isLoading={isLoading} />
        <StatCard title="Total Expenses" amount={stats.expense} icon={TrendingDown} type="expense" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Add Form */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-fit">
          <div className="flex items-center gap-2 mb-6">
             <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Plus className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-slate-800">Quick Add</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setNewTx({ ...newTx, type: 'income' })}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${newTx.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Income
              </button>
              <button
                onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${newTx.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Expense
              </button>
            </div>

            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Amount</label>
               <input type="number" placeholder="0.00" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-lg" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} />
            </div>
            
            {/* Category Dropdown */}
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category</label>
               <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
               >
                  <option value="" disabled>Select {newTx.type} Category</option>
                  {filteredCats.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
               </select>
            </div>

            {/* Description Input */}
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description (Optional)</label>
               <input type="text" placeholder="e.g. Dinner with friends" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" value={newTx.note} onChange={e => setNewTx({ ...newTx, note: e.target.value })} />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Date</label>
                <input type="date" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-600" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${newTx.is_recurring ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`} onClick={() => setNewTx({...newTx, is_recurring: !newTx.is_recurring})}>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newTx.is_recurring ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>{newTx.is_recurring && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}</div>
                <span className={`text-sm font-semibold select-none ${newTx.is_recurring ? 'text-blue-700' : 'text-slate-500'}`}>Recurring (Monthly)</span>
            </div>

            <button onClick={addTransaction} disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2">
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Transaction'}
            </button>
          </div>
        </div>

        {/* Right Column: Recent Transactions List */}
        <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
                <button onClick={fetchDashboard} className="text-slate-400 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-full">
                   <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    // Skeleton Loader for List
                    <div className="p-6 space-y-8">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="flex justify-between items-center animate-pulse">
                            <div className="flex gap-4 items-center">
                               <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                               <div className="space-y-2">
                                  <div className="w-32 h-4 bg-slate-100 rounded-lg"></div>
                                  <div className="w-20 h-3 bg-slate-100 rounded-lg"></div>
                               </div>
                            </div>
                            <div className="w-24 h-6 bg-slate-100 rounded-lg"></div>
                         </div>
                       ))}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {transactions.map((tx, i) => (
                        <div key={i} className="flex justify-between items-center p-5 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-colors ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'}`}>
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-lg">{tx.category || 'General'}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wide">
                                        <Calendar className="w-3 h-3" />
                                        {tx.date} • {tx.note}
                                    </div>
                                </div>
                            </div>
                            <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {tx.type === 'income' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                        </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="text-center py-24 text-slate-400 flex flex-col items-center">
                                <div className="bg-slate-50 p-6 rounded-full mb-4"><Wallet className="w-8 h-8" /></div>
                                <p className="font-bold text-lg text-slate-500">No transactions yet.</p>
                                <p className="text-sm">Add one to get started!</p>
                            </div>
                        )}
                    </div>
                    // <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>{tx.type === 'income' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}