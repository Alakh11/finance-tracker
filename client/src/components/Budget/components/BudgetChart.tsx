import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props {
  history: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const limit = payload[0].payload.budget_limit;
      const spent = payload[0].payload.total_spent;
      const diff = limit - spent;
      const isOver = diff < 0;
  
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-stone-100 text-xs">
          <p className="font-bold text-stone-800 text-sm mb-2">{label}</p>
          <div className="space-y-1">
              <p className="flex justify-between gap-4 text-stone-500">
                  <span>Budget:</span> <span className="font-bold">₹{limit.toLocaleString()}</span>
              </p>
              <p className="flex justify-between gap-4 text-stone-500">
                  <span>Spent:</span> <span className={`font-bold ${isOver ? 'text-rose-500' : 'text-blue-500'}`}>₹{spent.toLocaleString()}</span>
              </p>
              <div className="h-px bg-stone-100 my-1"></div>
              <p className={`font-bold text-right ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isOver ? `Over by ₹${Math.abs(diff).toLocaleString()}` : `Saved ₹${diff.toLocaleString()}`}
              </p>
          </div>
        </div>
      );
    }
    return null;
  };

export default function BudgetChart({ history }: Props) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-50 shadow-sm h-full flex flex-col">
        <h3 className="font-bold text-stone-700 text-lg mb-2">Spending Trends</h3>
        <p className="text-stone-400 text-xs mb-6">Comparison of your monthly budget vs actual spending</p>
        
        <div className="flex-1 w-full min-h-[300px]">
            {history && history.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#9CA3AF'}} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#9CA3AF'}} 
                            tickFormatter={(value) => `₹${value/1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Budget Limit as a Dashed Line for clear "Ceiling" visual */}
                        <Line 
                            type="monotone" 
                            dataKey="budget_limit" 
                            stroke="#9CA3AF" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={false}
                            name="Budget Limit"
                        />
                        
                        {/* Actual Spending as Gradient Bar */}
                        <Bar 
                            dataKey="total_spent" 
                            name="Actual Spent" 
                            fill="url(#colorSpent)" 
                            radius={[6, 6, 0, 0]} 
                            barSize={32}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                    No history data available yet.
                </div>
            )}
        </div>
    </div>
  );
}