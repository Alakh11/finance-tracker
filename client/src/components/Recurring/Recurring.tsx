import { useState } from 'react';
import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import { Repeat, Trash2, ArrowRight, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import type { Transaction } from '../../types';

export default function Recurring() {
  const router = useRouter();
  const user = router.options.context?.user;
  const recurring = useLoaderData({ from: '/recurring' });
  
  const [processingId, setProcessingId] = useState<number | null>(null);
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const totalRecurring = recurring.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

  // Helper: Format "Last Paid" text
  const getLastPaidText = (dateString: string | null) => {
    if (!dateString) return "Not paid yet";
    
    const paidDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - paidDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 0 || diffDays === 1) return "Paid Today";
    if (diffDays === 2) return "Paid Yesterday";
    if (diffDays <= 30) return `Paid ${diffDays - 1} days ago`;
    
    return `Last: ${paidDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  };

  const processPayment = async (tx: Transaction) => {
      setProcessingId(tx.id);
      try {
        await axios.post(`${API_URL}/transactions`, {
            user_email: user.email,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            payment_mode: tx.payment_mode || "Card",
            date: new Date().toISOString().split('T')[0],
            note: tx.note,
            is_recurring: false // Ensure this doesn't create a duplicate rule
        });
        
        setTimeout(() => {
            alert(`✅ Recorded payment for ${tx.note}!`);
            router.invalidate();
            setProcessingId(null);
        }, 500);

      } catch (error) {
          alert("Failed to process payment");
          setProcessingId(null);
      }
  };

  const stopRecurring = async (id: number) => {
      if(confirm("Stop this recurring bill? It will be removed from this list.")) {
          try {
            await axios.delete(`${API_URL}/recurring/stop/${id}`);
            router.invalidate();
          } catch (e) {
              alert("Failed to stop recurring bill");
          }
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
                    Recurring Bills
                </h2>
                <p className="text-stone-500 mt-1">Manage subscriptions, rent, and regular payments.</p>
            </div>
            
            {recurring.length > 0 && (
                <div className="bg-stone-900 text-white px-6 py-3 rounded-2xl shadow-lg shadow-stone-200 flex items-center gap-3">
                    <div className="p-2 bg-stone-800 rounded-lg">
                        <Repeat className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-400 font-bold uppercase">Monthly Total</p>
                        <p className="text-xl font-bold">₹{totalRecurring.toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recurring.map((tx: any) => {
                const lastPaidText = getLastPaidText(tx.last_paid);
                const isPaidRecently = lastPaidText.includes("Today") || lastPaidText.includes("Yesterday") || (tx.last_paid && new Date(tx.last_paid).getMonth() === new Date().getMonth());

                return (
                <div key={tx.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 relative overflow-hidden group hover:shadow-md transition-all">
                    
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-stone-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        
                        {/* Top: Icon & Delete */}
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-stone-50 rounded-xl text-2xl border border-stone-100">
                                    {tx.category_icon || tx.category?.charAt(0) || 'R'}
                                </div>
                                <button 
                                    onClick={() => stopRecurring(tx.id)} 
                                    className="text-stone-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition"
                                    title="Stop Recurring"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-stone-800 leading-tight mb-1">
                                {tx.note || 'Subscription'}
                            </h3>
                            <p className="text-stone-400 text-sm font-bold uppercase tracking-wide">
                                {tx.category}
                            </p>
                        </div>

                        {/* Middle: Amount & Last Paid Status */}
                        <div className="mt-6 mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-stone-800">
                                    ₹{Number(tx.amount).toLocaleString()}
                                </span>
                                <span className="text-stone-400 font-medium text-sm">/mo</span>
                            </div>
                            
                            {/* LAST PAID INDICATOR */}
                            <div className={`flex items-center gap-2 mt-3 text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${
                                isPaidRecently ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'
                            }`}>
                                {isPaidRecently ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                <span>{lastPaidText}</span>
                            </div>
                        </div>

                        {/* Bottom: Action Button */}
                        <button 
                            onClick={() => processPayment(tx)}
                            disabled={processingId === tx.id}
                            className={`w-full py-3.5 rounded-xl font-bold active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                                isPaidRecently 
                                ? 'bg-white border-2 border-stone-100 text-stone-400 hover:bg-stone-50' 
                                : 'bg-stone-900 text-white hover:bg-stone-800'
                            }`}
                        >
                            {processingId === tx.id ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                </>
                            ) : isPaidRecently ? (
                                <>
                                    Pay Again <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Mark Paid <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )})}
            
            {/* Empty State */}
            {recurring.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-stone-100 border-dashed">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                        <Repeat className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-600">No recurring bills set</h3>
                    <p className="text-stone-400 text-sm mt-1 max-w-xs text-center">
                        Add a transaction with the <b>"Recurring"</b> checkbox enabled to track your subscriptions here.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}