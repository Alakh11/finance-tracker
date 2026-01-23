import { useState } from 'react';
import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import {
  Wallet, TrendingUp, TrendingDown, Plus,
  CreditCard, Calendar, CheckCircle2, RefreshCw
} from 'lucide-react';
import type { Transaction } from '../../types';

// --- Colorful Stat Card ---
const StatCard = ({ title, amount, icon: Icon, type }: any) => {
  const styles = {
    balance: { 
        bg: 'bg-gradient-to-br from-blue-600 to-indigo-700', 
        text: 'text-white', 
        sub: 'text-blue-100', 
        icon: 'bg-white/20 text-white' 
    },
    income: { 
        bg: 'bg-white', 
        text: 'text-slate-800', 
        sub: 'text-slate-400', 
        icon: 'bg-emerald-100 text-emerald-600' 
    },
    expense: { 
        bg: 'bg-white', 
        text: 'text-slate-800', 
        sub: 'text-slate-400', 
        icon: 'bg-rose-100 text-rose-600' 
    },
  }[type as 'balance' | 'income' | 'expense'];

  return (
    <div className={`${styles.bg} p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className={`${styles.sub} text-sm font-bold mb-2 uppercase tracking-wide`}>{title}</p>
          <h3 className={`${styles.text} text-3xl font-extrabold tracking-tight`}>
            ₹{amount.toLocaleString('en-IN')}
          </h3>
        </div>
        <div className={`p-4 rounded-2xl ${styles.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const user = router.options.context.user;
  
  const { totals, recent: transactions, categories } = useLoaderData({ from: '/dashboard' });
  const stats = { income: 0, expense: 0, balance: 0 };
  totals.forEach((t: any) => {
    if (t.type === 'income') stats.income = Number(t.total);
    if (t.type === 'expense') stats.expense = Number(t.total);
  });
  stats.balance = stats.income - stats.expense;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: '',
    type: 'expense',
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const addTransaction = async () => {
    if (!newTx.amount) {
        alert("Please enter an amount");
        return;
    }
    if (!newTx.category) {
        alert("Please select a category");
        return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/transactions`, {
        user_email: user.email,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: newTx.category,
        payment_mode: "UPI",
        date: newTx.date,
        note: newTx.note,
        is_recurring: newTx.is_recurring
      });
      
      // Reset Form
      setNewTx({ ...newTx, amount: '', note: '', category: '' });
      
      // 5. Instantly Refresh Data
      router.invalidate(); 
    } catch (err) {
      alert("Error adding transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Categories for Dropdown
  const filteredCats = categories.filter((c: any) => c.type === newTx.type);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Balance" amount={stats.balance} icon={Wallet} type="balance" />
        <StatCard title="Total Income" amount={stats.income} icon={TrendingUp} type="income" />
        <StatCard title="Total Expenses" amount={stats.expense} icon={TrendingDown} type="expense" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Add Form */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-fit">
          <div className="flex items-center gap-2 mb-6">
             <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Plus className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-slate-800">Quick Add</h2>
          </div>

          <div className="space-y-5">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setNewTx({ ...newTx, type: 'income', category: '' })}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${newTx.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Income
              </button>
              <button
                onClick={() => setNewTx({ ...newTx, type: 'expense', category: '' })}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${newTx.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Expense
              </button>
            </div>

            {/* Amount */}
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Amount</label>
               <input
                 type="number"
                 placeholder="0.00"
                 className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-lg text-slate-700"
                 value={newTx.amount}
                 onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
               />
            </div>
            
            {/* Category Dropdown */}
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category</label>
               <select 
                  value={newTx.category} 
                  onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
               >
                  <option value="" disabled>Select {newTx.type} Category</option>
                  {filteredCats.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
               </select>
            </div>

            {/* Description */}
            <div>
               <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
               <input
                 type="text"
                 placeholder="e.g. Dinner with friends"
                 className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                 value={newTx.note}
                 onChange={e => setNewTx({ ...newTx, note: e.target.value })}
               />
            </div>

            {/* Date */}
            <div className="relative">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Date</label>
                <input
                    type="date"
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-600"
                    value={newTx.date}
                    onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                />
            </div>

            {/* Recurring Checkbox */}
            <div 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${newTx.is_recurring ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                onClick={() => setNewTx({...newTx, is_recurring: !newTx.is_recurring})}
            >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newTx.is_recurring ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                    {newTx.is_recurring && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm font-semibold select-none ${newTx.is_recurring ? 'text-blue-700' : 'text-slate-500'}`}>
                    Recurring (Monthly)
                </span>
            </div>

            <button
              onClick={addTransaction}
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Transaction'}
            </button>
          </div>
        </div>

        {/* Right Column: Recent Transactions List */}
        <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {transactions.map((tx: Transaction) => (
                    <div key={tx.id} className="flex justify-between items-center p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-lg">{tx.category || 'General'}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wide">
                                    <Calendar className="w-3 h-3" />
                                    {tx.date} • {tx.note || 'No description'}
                                </div>
                            </div>
                        </div>
                        <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {tx.type === 'income' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                    </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-3"><Wallet className="w-6 h-6" /></div>
                            <p className="font-medium">No transactions yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}