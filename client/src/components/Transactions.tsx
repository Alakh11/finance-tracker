import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Trash2 } from 'lucide-react';
import type { User, Transaction } from '../types';

export default function Transactions({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/transactions/all/${user.email}`).then(res => setTransactions(res.data));
  }, []);

  const filtered = transactions.filter(t => {
     const matchesSearch = (t.note || t.category).toLowerCase().includes(search.toLowerCase());
     const matchesType = filter === 'all' || t.type === filter;
     return matchesSearch && matchesType;
  });
//   const deleteTransaction = async (id: number) => {
//     if(confirm("Delete this transaction?")) {
//         await axios.delete(`${API_URL}/transactions/${id}`);
//         setTransactions(transactions.filter(t => t.id !== id));
//     }
// }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between gap-4">
          <h2 className="text-3xl font-bold text-stone-800">Transactions</h2>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <select 
               className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl outline-none"
               value={filter}
               onChange={e => setFilter(e.target.value)}
             >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
             </select>
          </div>
       </div>

       <div className="bg-white rounded-[2rem] shadow-sm border border-stone-50 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-stone-50 text-stone-500 text-sm font-semibold uppercase">
                <tr>
                   <th className="p-6">Description</th>
                   <th className="p-6">Category</th>
                   <th className="p-6">Date</th>
                   <th className="p-6 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-stone-50">
                {filtered.map((t, i) => (
                   <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-6 font-bold text-stone-700">{t.note || 'No Description'}</td>
                      <td className="p-6">
                         <span className="px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-stone-500">{t.category}</span>
                      </td>
                      <td className="p-6 text-stone-500 text-sm">{t.date}</td>
                      <td className="p-6 text-right font-bold flex justify-end items-center gap-4">
                        <span className={t.type === 'income' ? 'text-emerald-600' : 'text-stone-800'}>
                            {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                        </span>
                        <button onClick={async () => {
                            if(confirm("Delete transaction?")) {
                                await axios.delete(`https://finance-tracker-q60v.onrender.com/transactions/${t.id}`);
                                // Refresh logic (e.g. reload page or update state)
                                window.location.reload(); 
                            }
                        }} className="text-stone-300 hover:text-rose-500"><Trash2 size={18} /></button>
                    </td>
                   </tr>
                ))}
             </tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center text-stone-400">No transactions found.</div>}
       </div>
    </div>
  );
}