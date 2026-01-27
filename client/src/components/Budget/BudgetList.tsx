import { AlertTriangle } from 'lucide-react';

interface Props {
  budgets: any[];
}

export default function BudgetList({ budgets }: Props) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-stone-50 shadow-sm space-y-6">
        <h3 className="font-bold text-stone-700 text-lg mb-4">Category Budgets</h3>
        {budgets.length === 0 ? (
            <div className="text-center text-stone-400 py-10">No budgets set yet.</div>
        ) : (
            budgets.map((b: any) => (
            <div key={b.category_id} className="group">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xl bg-stone-50 p-2 rounded-lg">{b.icon}</span>
                        <div>
                            <p className="font-bold text-stone-700">{b.name}</p>
                            <p className="text-xs text-stone-400">
                                ₹{b.spent.toLocaleString()} spent of ₹{b.budget_limit.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    {/* Alert Icon */}
                    {b.is_over ? (
                        <div className="flex items-center gap-1 text-rose-500 bg-rose-50 px-2 py-1 rounded-lg text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" /> Over
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-stone-400">{Math.round(b.percentage)}%</span>
                    )}
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            b.is_over ? 'bg-rose-500' : 
                            b.percentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
            ))
        )}
    </div>
  );
}