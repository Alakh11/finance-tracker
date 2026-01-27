import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Props {
  history: any[];
}

export default function BudgetChart({ history }: Props) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-stone-50 shadow-sm">
        <h3 className="font-bold text-stone-700 text-lg mb-6">Budget vs Spending History</h3>
        <div className="h-64 w-full">
            {history && history.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history} barGap={0}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="budget_limit" name="Budget Limit" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="total_spent" name="Actual Spent" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                    No history data available yet.
                </div>
            )}
           
            <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-stone-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div> Budget Limit
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Actual Spent
                </div>
            </div>
        </div>
    </div>
  );
}