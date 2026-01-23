import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import { Repeat, Plus, Trash2, } from 'lucide-react';
import type { Transaction } from '../types';

export default function Recurring() {
  const router = useRouter();
  const user = router.options.context.user;
  const recurring = useLoaderData({ from: '/recurring' }); // Get data from loader
  
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const processPayment = async (tx: Transaction) => {
      // Clone the transaction for TODAY
      await axios.post(`${API_URL}/transactions`, {
          user_email: user.email,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          payment_mode: tx.payment_mode || "Card",
          date: new Date().toISOString().split('T')[0],
          note: tx.note,
          is_recurring: true
      });
      alert(`Processed ${tx.note} for this month!`);
      router.invalidate(); // Refresh data
  };

  const stopRecurring = async (id: number) => {
      if(confirm("Stop this recurring bill? It will no longer appear here.")) {
          await axios.delete(`${API_URL}/recurring/stop/${id}`);
          router.invalidate();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-stone-800">Recurring Bills</h2>
        <p className="text-stone-500">Manage your subscriptions, rent, and EMIs.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recurring.map((tx: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Repeat size={100} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-stone-800">{tx.note || 'Subscription'}</h3>
                            <button onClick={() => stopRecurring(tx.id)} className="text-stone-300 hover:text-rose-500 transition">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <p className="text-stone-400 text-sm font-medium mb-4">{tx.category}</p>
                        
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-3xl font-bold text-stone-800">₹{tx.amount.toLocaleString()}</span>
                            <span className="text-stone-400 text-sm">/ month</span>
                        </div>

                        <button 
                            onClick={() => processPayment(tx)}
                            className="w-full py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition flex justify-center items-center gap-2"
                        >
                            <Plus size={18} /> Add for this Month
                        </button>
                    </div>
                </div>
            ))}
            
            {recurring.length === 0 && (
                <div className="col-span-full text-center py-10 bg-white rounded-[2rem] border border-stone-50 border-dashed">
                    <Repeat className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                    <p className="text-stone-400 font-medium">No recurring expenses found yet.</p>
                    <p className="text-stone-300 text-sm">Add a transaction with "Recurring" checked to see it here.</p>
                </div>
            )}
        </div>
    </div>
  );
}