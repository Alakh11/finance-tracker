import { useState } from 'react';
import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import { Pencil, Check, X, AlertCircle, TrendingUp } from 'lucide-react';

export default function BudgetPlanner() {
  const router = useRouter();
  const user = router.options.context.user;
  const { budgets } = useLoaderData({ from: '/budget' });

  const [editing, setEditing] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const handleUpdate = async (categoryName: string) => {
    await axios.post(`${API_URL}/budgets`, {
      user_email: user.email,
      category_name: categoryName,
      limit: parseFloat(newLimit)
    });
    setEditing(null);
    // 2. Refresh data
    router.invalidate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monthly Budgets</h2>
          <p className="text-slate-500">Track your spending limits per category.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {budgets.filter((b: any) => b.spent > b.budget_limit && b.budget_limit > 0).length} Categories over budget
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((b: any) => {
          const percentage = b.budget_limit > 0 ? (b.spent / b.budget_limit) * 100 : 0;
          const isOverBudget = b.spent > b.budget_limit && b.budget_limit > 0;
          const barColor = isOverBudget ? 'bg-rose-500' : (percentage > 80 ? 'bg-orange-500' : 'bg-blue-600');

          return (
            <div key={b.name} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm" style={{ backgroundColor: b.color || '#3b82f6' }}>
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{b.name}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Budget Category</p>
                  </div>
                </div>

                {editing === b.name ? (
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <input
                      type="number"
                      className="w-20 bg-transparent text-sm font-semibold outline-none px-2"
                      placeholder="Limit"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(b.name)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check size={14} /></button>
                    <button onClick={() => setEditing(null)} className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditing(b.name); setNewLimit(String(b.budget_limit)); }} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil size={16} />
                  </button>
                )}
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-2xl font-bold text-slate-800">₹{b.spent.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm font-medium ml-1">/ ₹{b.budget_limit.toLocaleString()}</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{Math.min(percentage, 100).toFixed(0)}%</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              {isOverBudget && (
                <div className="mt-3 flex items-start gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg text-xs font-medium">
                  <AlertCircle size={14} className="mt-0.5" />
                  <span>You have exceeded your limit by ₹{(b.spent - b.budget_limit).toLocaleString()}.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}