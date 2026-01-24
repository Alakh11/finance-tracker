import { useMemo } from 'react';
import { useLoaderData } from '@tanstack/react-router';
import { 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from 'lucide-react';

export default function Analytics() {
  const { pie, bar, dailyIncome,monthlyIncome, categoryMonthly } = useLoaderData({ from: '/analytics' });
  
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

  // 1. Process Data for Savings Trend (Income - Expense)
  const savingsData = useMemo(() => {
    return bar.map((item: any) => ({
      name: item.name,
      savings: item.income - item.expense,
      income: item.income,
      expense: item.expense
    }));
  }, [bar]);

  // 2. Process Data for Category-wise Monthly Stacked Bar
  const { stackedData, categories } = useMemo(() => {
    const uniqueCategories = new Set<string>();
    const grouped: any = {};

    categoryMonthly.forEach((item: any) => {
        uniqueCategories.add(item.category);
        if (!grouped[item.month]) {
            grouped[item.month] = { name: item.month };
        }
        grouped[item.month][item.category] = item.total;
    });

    return {
        stackedData: Object.values(grouped),
        categories: Array.from(uniqueCategories)
    };
  }, [categoryMonthly]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Financial Analytics</h2>
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
      
      {/* ROW 1: Expense Pie & Savings Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expense Breakdown (Pie Chart) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><PieIcon className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-stone-700">Expense Breakdown</h3>
           </div>
           <div className="h-72">
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
                 <Tooltip formatter={(value: number | undefined) => `₹${(value || 0).toLocaleString()}`} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 2. Savings Trend (Line Chart) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><LineIcon className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-stone-700">Savings Trend</h3>
           </div>
           <div className="h-72 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={savingsData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(v) => `₹${v/1000}k`} />
                 <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Savings']}
                 />
                 <Legend />
                 <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* ROW 2: Income vs Expense & Category Monthly Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 3. Monthly Income vs Expense (Bar Chart) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-stone-700">Income vs Expense</h3>
           </div>
           <div className="h-72 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={bar} barGap={8}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(v) => `₹${v/1000}k`} />
                 <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                 />
                 <Legend />
                 <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                 <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 4. Category-wise Monthly Analysis (Stacked Bar) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-stone-700">Monthly Category Analysis</h3>
           </div>
           <div className="h-72 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stackedData} barGap={0}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(v) => `₹${v/1000}k`} />
                 <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                 />
                 {/* No Legend to save space, tooltip shows details */}
                 {categories.map((cat: string, index: number) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[index % COLORS.length]} radius={[0, 0, 0, 0]} barSize={30} />
                 ))}
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
      
      {/* Daily Income Log (Kept from previous) */}
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
          <h3 className="text-lg font-bold text-stone-700 mb-6">Recent Daily Income</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
               {dailyIncome.length === 0 ? (
                   <p className="text-stone-400 text-sm">No recent income records found.</p>
               ) : (
                   dailyIncome.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                           <span className="font-bold text-stone-600 text-sm">{item.date}</span>
                           <span className="font-bold text-emerald-600">+ ₹{item.total.toLocaleString()}</span>
                       </div>
                   ))
               )}
          </div>
      </div>

    </div>
  );
}