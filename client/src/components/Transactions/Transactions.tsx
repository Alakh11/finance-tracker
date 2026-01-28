import { useState } from 'react';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import axios from 'axios';
import { 
  Search, Filter, X, Calendar, IndianRupee, Tag, Trash2, Repeat, CreditCard 
} from 'lucide-react';
import type { Transaction } from '../../types';

export default function Transactions() {
  const router = useRouter();
  const { initialTransactions, categories } = useLoaderData({ from: '/transactions' });
  const user = router.options.context?.user;
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    category_id: '',
    min_amount: '',
    max_amount: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
        const params: any = {};
        Object.keys(filters).forEach(key => {
            // @ts-ignore
            if (filters[key]) params[key] = filters[key];
        });

        const res = await axios.get(`${API_URL}/transactions/all/${user.email}`, { params });
        setTransactions(res.data);
    } catch (error) {
        console.error("Filter failed", error);
    } finally {
        setLoading(false);
    }
  };

  const clearFilters = async () => {
    if (!user?.email) return;
    setFilters({ search: '', start_date: '', end_date: '', category_id: '', min_amount: '', max_amount: '' });
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/transactions/all/${user.email}`);
        setTransactions(res.data);
    } catch (error) {
        console.error("Reset failed", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure you want to delete this transaction?")) return;
      try {
          await axios.delete(`${API_URL}/transactions/${id}`);
          setTransactions(prev => prev.filter(t => t.id !== id));
          router.invalidate(); 
      } catch (e) {
          alert("Failed to delete transaction");
      }
  };
  const inputBaseClass = "w-full pl-10 pr-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-stone-800 dark:focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-stone-700 dark:text-white";
  const labelClass = "text-xs font-bold text-stone-500 dark:text-slate-400 uppercase";

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* --- Header & Search --- */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-3xl font-bold text-stone-800 dark:text-white">Transactions</h2>
        
        <div className="flex gap-2">
           <div className="relative flex-1 md:w-64">
               <button 
                    onClick={applyFilters}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                    <Search className="w-4 h-4" />
                </button>
                
               <input 
                  type="text" 
                  name="search"
                  placeholder="Search... (Press Enter)" 
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800 dark:focus:ring-blue-500"
               />
           </div>
           <button 
             onClick={() => setIsFilterOpen(!isFilterOpen)}
             className={`p-2.5 rounded-xl border transition-colors ${
                isFilterOpen 
                ? 'bg-stone-800 text-white border-stone-800 dark:bg-blue-600 dark:border-blue-600' 
                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-800'
             }`}
           >
             <Filter className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* --- Expandable Filter Panel --- */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Date Inputs */}
                <div className="space-y-1">
                    <label className={labelClass}>From Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                        <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className={inputBaseClass} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className={labelClass}>To Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                        <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className={inputBaseClass} />
                    </div>
                </div>

                {/* Amount Inputs */}
                <div className="space-y-1">
                    <label className={labelClass}>Min Amount</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                        <input type="number" name="min_amount" placeholder="0" value={filters.min_amount} onChange={handleFilterChange} className={inputBaseClass} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className={labelClass}>Max Amount</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                        <input type="number" name="max_amount" placeholder="∞" value={filters.max_amount} onChange={handleFilterChange} className={inputBaseClass} />
                    </div>
                </div>

                {/* Category Dropdown */}
                <div className="md:col-span-2 lg:col-span-4 space-y-1">
                    <label className={labelClass}>Category</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
                        <select name="category_id" value={filters.category_id} onChange={handleFilterChange} className={inputBaseClass}>
                            <option value="">All Categories</option>
                            {categories?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2">
                    <X className="w-4 h-4" /> Clear
                </button>
                <button onClick={applyFilters} disabled={loading} className="px-6 py-2 bg-stone-900 dark:bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-stone-800 dark:hover:bg-blue-500 transition disabled:opacity-50">
                    {loading ? 'Filtering...' : 'Apply Filters'}
                </button>
            </div>
        </div>
      )}

      {/* --- TABLE UI --- */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-stone-50 dark:border-slate-800 overflow-hidden transition-colors">
        {loading ? (
             <div className="p-10 text-center text-stone-400 dark:text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                 <thead className="bg-stone-50 dark:bg-slate-800 text-stone-500 dark:text-slate-400 text-sm font-semibold uppercase">
                    <tr>
                       <th className="p-6 whitespace-nowrap">Category</th>
                       <th className="p-6 whitespace-nowrap">Description</th>
                       <th className="p-6 whitespace-nowrap">Date</th>
                       <th className="p-6 whitespace-nowrap">Payment</th>
                       <th className="p-6 text-right whitespace-nowrap">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-50 dark:divide-slate-800">
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-10 text-center text-stone-400 dark:text-slate-500">No transactions found.</td>
                        </tr>
                    ) : (
                        transactions.map((t: Transaction) => (
                        <tr key={t.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                            {/* 1. Category */}
                            <td className="p-6 whitespace-nowrap">
                                <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-xs font-bold text-stone-500 dark:text-slate-300 flex items-center gap-2 w-fit">
                                    {t.category_name || t.category || 'Uncategorized'}
                                </span>
                            </td>

                            {/* 2. Description */}
                            <td className="p-6 font-bold text-stone-700 dark:text-slate-200 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                    {t.description || t.note || 'No Description'}
                                    {/* Recurring Icon */}
                                    {t.is_recurring === 1 ? (
                                        <div className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 p-1 rounded-md" title="Recurring Transaction">
                                            <Repeat className="w-3 h-3" />
                                        </div>
                                    ) : null}
                                    {t.tags && <span className="text-xs font-normal text-blue-500">#{t.tags}</span>}
                                </div>
                            </td>

                            {/* 3. Date */}
                            <td className="p-6 text-stone-500 dark:text-slate-400 text-sm whitespace-nowrap">
                                {new Date(t.date).toLocaleDateString()}
                            </td>

                            {/* 4. Payment Mode */}
                            <td className="p-6 text-stone-500 dark:text-slate-400 text-sm whitespace-nowrap font-medium">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                                    {t.payment_mode || 'Cash'}
                                </div>
                            </td>

                            {/* 5. Amount + Delete Button */}
                            <td className="p-6 text-right font-bold flex justify-end items-center gap-4 whitespace-nowrap">
                                <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-800 dark:text-slate-200'}>
                                    {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                                </span>
                                <button 
                                    onClick={() => handleDelete(t.id)} 
                                    className="text-stone-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition opacity-100 md:opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                        ))
                    )}
                 </tbody>
              </table>
          </div>
        )}
      </div>
    </div>
  );
}