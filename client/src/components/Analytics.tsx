import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { User } from '../types';

interface Props { user: User; }

export default function Analytics({ user }: Props) {
  const [data, setData] = useState<{ pie: any[], bar: any[] }>({ pie: [], bar: [] });
  const API_URL = "https://finance-tracker-q60v.onrender.com";
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    axios.get(`${API_URL}/analytics/${user.email}`).then(res => setData(res.data));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Financial Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown (Pie) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <h3 className="text-lg font-bold text-stone-700 mb-6">Expense Breakdown</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={data.pie} 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                 >
                   {data.pie.map(( index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Monthly Trend (Bar) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50">
           <h3 className="text-lg font-bold text-stone-700 mb-6">Income vs Expense</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.bar}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f5f5f4'}} />
                 <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}