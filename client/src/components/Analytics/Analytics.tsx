import { useLoaderData } from '@tanstack/react-router';
import { 
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export default function Analytics() {
  const { pie, dailyIncome, monthlyIncome } = useLoaderData({ from: '/analytics' });
  
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Financial Insights</h2>
      
      {/* --- Monthly Income Summary (Area Chart) --- */}
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                   <TrendingUp className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-stone-700">Monthly Income Trend</h3>
           </div>
           
           <div className="h-72 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[...monthlyIncome].reverse()}>
                 <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <XAxis dataKey="display_name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                 <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Income']}
                 />
                 <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expense Breakdown (Pie Chart) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <h3 className="text-lg font-bold text-stone-700 mb-6">Expense Breakdown</h3>
           
           <div className="h-64 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={pie} 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                 >
                   {pie.map((_: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Daily Income Log */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50 overflow-hidden">
           <h3 className="text-lg font-bold text-stone-700 mb-6">Recent Daily Income</h3>
           <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
               {dailyIncome.length === 0 ? (
                   <p className="text-stone-400 text-sm">No recent income records found.</p>
               ) : (
                   dailyIncome.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-white rounded-lg text-stone-400 shadow-sm">
                                   <Calendar className="w-4 h-4" />
                                </div>
                               <span className="font-bold text-stone-600 text-sm">{item.date}</span>
                           </div>
                           <span className="font-bold text-emerald-600">+ ₹{item.total.toLocaleString()}</span>
                       </div>
                   ))
               )}
           </div>
        </div>
      </div>
    </div>
  );
}