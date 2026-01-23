import { useState } from 'react';
import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import { Plus, Trophy, Trash2, TrendingUp, Minus } from 'lucide-react';
import { differenceInMonths, differenceInDays, parseISO } from 'date-fns';

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
}

export default function Goals() {
  const router = useRouter();
  const user = router.options.context.user;
  
  const { goals } = useLoaderData({ from: '/goals' });

  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '' });
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const createGoal = async () => {
     if(!newGoal.name || !newGoal.target) return;
     await axios.post(`${API_URL}/goals`, {
        user_email: user.email,
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target),
        deadline: newGoal.deadline || null
     });
     setShowForm(false);
     setNewGoal({ name: '', target: '', deadline: '' });
     router.invalidate();
  };

  const updateMoney = async (id: number, type: 'add' | 'withdraw') => {
      const promptText = type === 'add' ? "Enter amount to save:" : "Enter amount to withdraw:";
      const input = prompt(promptText);
      if(input) {
          const amount = parseFloat(input);
          const finalAmount = type === 'withdraw' ? -amount : amount;
          
          await axios.put(`${API_URL}/goals/add-money`, { goal_id: id, amount_added: finalAmount });
          router.invalidate();
      }
  };

  const deleteGoal = async (id: number) => {
      if(confirm("Delete this goal?")) {
          await axios.delete(`${API_URL}/goals/${id}`);
          router.invalidate();
      }
  };

  const getSuggestion = (goal: Goal) => {
      if (!goal.deadline) return null;
      if (goal.current_amount >= goal.target_amount) return "Goal Reached! 🎉";

      const monthsLeft = differenceInMonths(parseISO(goal.deadline), new Date());
      const remaining = goal.target_amount - goal.current_amount;
      
      if (monthsLeft <= 0) return "Deadline passed";
      
      const monthly = Math.ceil(remaining / monthsLeft);
      return `Save ₹${monthly.toLocaleString()}/mo to hit target`;
  };

  const getDaysLeft = (dateStr?: string) => {
      if(!dateStr) return null;
      const days = differenceInDays(parseISO(dateStr), new Date());
      return days > 0 ? `${days} days left` : 'Due today';
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-800">Savings Goals</h2>
            <p className="text-stone-500">Visualize and track your financial dreams.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-800 transition shadow-lg shadow-stone-200"
          >
             <Plus className="w-4 h-4" /> New Goal
          </button>
       </div>

       {showForm && (
           <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-stone-100 border border-stone-100 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-4">
               <div className="flex-1 w-full">
                   <label className="text-xs font-bold text-stone-400 uppercase ml-1">Goal Name</label>
                   <input className="w-full mt-1 p-3 bg-stone-50 rounded-xl outline-none font-bold text-stone-700" placeholder="e.g. New Laptop" value={newGoal.name} onChange={e=>setNewGoal({...newGoal, name: e.target.value})} />
               </div>
               <div className="flex-1 w-full">
                   <label className="text-xs font-bold text-stone-400 uppercase ml-1">Target Amount</label>
                   <input className="w-full mt-1 p-3 bg-stone-50 rounded-xl outline-none font-bold text-stone-700" type="number" placeholder="50000" value={newGoal.target} onChange={e=>setNewGoal({...newGoal, target: e.target.value})} />
               </div>
               <div className="flex-1 w-full">
                   <label className="text-xs font-bold text-stone-400 uppercase ml-1">Deadline (Optional)</label>
                   <input className="w-full mt-1 p-3 bg-stone-50 rounded-xl outline-none font-bold text-stone-500" type="date" value={newGoal.deadline} onChange={e=>setNewGoal({...newGoal, deadline: e.target.value})} />
               </div>
               <button onClick={createGoal} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold w-full md:w-auto hover:bg-blue-700 transition">Create</button>
           </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {goals.map((g: Goal) => {
               const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
               const suggestion = getSuggestion(g);
               const daysLeft = getDaysLeft(g.deadline);
               const isCompleted = g.current_amount >= g.target_amount;

               return (
                   <div key={g.id} className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                       
                       {/* Header */}
                       <div className="flex justify-between items-start mb-6">
                           <div className={`p-3.5 rounded-2xl transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                               <Trophy className="w-7 h-7" />
                           </div>
                           <button onClick={() => deleteGoal(g.id)} className="text-stone-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-full transition"><Trash2 size={18}/></button>
                       </div>

                       {/* Title & Amount */}
                       <div className="mb-4">
                           <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-stone-800 line-clamp-1">{g.name}</h3>
                                {daysLeft && !isCompleted && <span className="text-xs font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-lg whitespace-nowrap">{daysLeft}</span>}
                           </div>
                           <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-3xl font-extrabold text-stone-800">₹{g.current_amount.toLocaleString()}</span>
                                <span className="text-stone-400 font-medium">/ {g.target_amount.toLocaleString()}</span>
                           </div>
                       </div>

                       {/* Progress Bar */}
                       <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden mb-4">
                           <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                           ></div>
                       </div>

                       {/* Insight / Suggestion */}
                       {suggestion && (
                           <div className={`flex items-center gap-2 text-xs font-bold mb-6 ${isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'} p-2.5 rounded-xl`}>
                               <TrendingUp className="w-4 h-4" />
                               {suggestion}
                           </div>
                       )}

                       {/* Actions */}
                       <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => updateMoney(g.id, 'withdraw')} 
                                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-stone-50 text-stone-600 hover:bg-stone-100 transition"
                            >
                                <Minus size={16} /> Withdraw
                            </button>
                            <button 
                                onClick={() => updateMoney(g.id, 'add')} 
                                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 transition shadow-lg shadow-stone-200"
                            >
                                <Plus size={16} /> Add Money
                            </button>
                       </div>
                   </div>
               )
           })}
       </div>
    </div>
  );
}