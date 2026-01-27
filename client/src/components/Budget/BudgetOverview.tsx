import { Wallet, TrendingUp, IndianRupee } from 'lucide-react';

interface Props {
  budgets: any[];
}

export default function BudgetOverview({ budgets }: Props) {
  const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.budget_limit) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-stone-50 shadow-sm">
         <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
            <span className="text-stone-500 font-bold text-sm uppercase">Total Budget</span>
         </div>
         <p className="text-2xl font-black text-stone-800">₹{totalBudget.toLocaleString()}</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-stone-50 shadow-sm">
         <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <span className="text-stone-500 font-bold text-sm uppercase">Spent so far</span>
         </div>
         <p className="text-2xl font-black text-stone-800">₹{totalSpent.toLocaleString()}</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-stone-50 shadow-sm">
         <div className="flex items-center gap-4 mb-2">
            <div className={`p-3 rounded-xl ${totalRemaining < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <IndianRupee className="w-6 h-6" />
            </div>
            <span className="text-stone-500 font-bold text-sm uppercase">Remaining</span>
         </div>
         <p className={`text-2xl font-black ${totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
             {totalRemaining < 0 ? '-' : ''}₹{Math.abs(totalRemaining).toLocaleString()}
         </p>
      </div>
    </div>
  );
}