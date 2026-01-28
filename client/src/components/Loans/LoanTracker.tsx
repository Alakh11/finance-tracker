import { useState } from 'react';
import axios from 'axios';
import { useLoaderData, useRouter } from '@tanstack/react-router';
import { Plus, Trash2, Landmark, Calculator, CalendarClock, Percent } from 'lucide-react';

export default function LoanTracker() {
  const router = useRouter();
  const user = router.options.context?.user;
  const loans = useLoaderData({ from: '/loans' });
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const [showForm, setShowForm] = useState(false);
  const [newLoan, setNewLoan] = useState({
      name: '', total_amount: '', interest_rate: '', tenure_months: '', start_date: ''
  });

  const addLoan = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await axios.post(`${API_URL}/loans`, {
              user_email: user.email,
              name: newLoan.name,
              total_amount: parseFloat(newLoan.total_amount),
              interest_rate: parseFloat(newLoan.interest_rate),
              tenure_months: parseInt(newLoan.tenure_months),
              start_date: newLoan.start_date
          });
          setShowForm(false);
          setNewLoan({ name: '', total_amount: '', interest_rate: '', tenure_months: '', start_date: '' });
          router.invalidate();
      } catch (e) { alert("Error adding loan"); }
  };

  const deleteLoan = async (id: number) => {
      if(confirm("Delete this loan tracker?")) {
          await axios.delete(`${API_URL}/loans/${id}`);
          router.invalidate();
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
                    <Landmark className="w-8 h-8" /> Loan Tracker
                </h2>
                <p className="text-stone-500">Monitor your EMIs and repayment progress.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-stone-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 transition shadow-lg">
                <Plus size={18} /> New Loan
            </button>
        </div>

        {/* --- ADD FORM --- */}
        {showForm && (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-stone-100 animate-in slide-in-from-top-4">
                <form onSubmit={addLoan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Loan Name (e.g. Car Loan)" className="p-3 bg-stone-50 rounded-xl font-semibold outline-none" value={newLoan.name} onChange={e => setNewLoan({...newLoan, name: e.target.value})} required />
                    <input type="number" placeholder="Total Amount" className="p-3 bg-stone-50 rounded-xl font-semibold outline-none" value={newLoan.total_amount} onChange={e => setNewLoan({...newLoan, total_amount: e.target.value})} required />
                    <input type="number" step="0.1" placeholder="Interest Rate (%)" className="p-3 bg-stone-50 rounded-xl font-semibold outline-none" value={newLoan.interest_rate} onChange={e => setNewLoan({...newLoan, interest_rate: e.target.value})} required />
                    <input type="number" placeholder="Tenure (Months)" className="p-3 bg-stone-50 rounded-xl font-semibold outline-none" value={newLoan.tenure_months} onChange={e => setNewLoan({...newLoan, tenure_months: e.target.value})} required />
                    <input type="date" className="p-3 bg-stone-50 rounded-xl font-semibold outline-none" value={newLoan.start_date} onChange={e => setNewLoan({...newLoan, start_date: e.target.value})} required />
                    <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500">Calculate & Save</button>
                </form>
            </div>
        )}

        {/* --- LOAN CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loans.map((loan: any) => (
                <div key={loan.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm relative group">
                    <button onClick={() => deleteLoan(loan.id)} className="absolute top-6 right-6 text-stone-300 hover:text-rose-500 transition"><Trash2 size={18} /></button>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-stone-900 text-white rounded-2xl">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-stone-800">{loan.name}</h3>
                            <div className="flex gap-3 text-xs font-bold text-stone-400 uppercase mt-1">
                                <span className="flex items-center gap-1"><Percent size={12}/> {loan.interest_rate}% Rate</span>
                                <span className="flex items-center gap-1"><CalendarClock size={12}/> {loan.tenure_months} Months</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-xl flex justify-between items-center mb-6">
                        <div>
                            <p className="text-xs font-bold text-stone-400 uppercase">Monthly EMI</p>
                            <p className="text-2xl font-black text-stone-800">₹{Math.round(loan.emi_amount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold text-stone-400 uppercase">Total + Interest</p>
                             <p className="text-lg font-bold text-stone-600">₹{Math.round(loan.emi_amount * loan.tenure_months).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-emerald-600">Paid: ₹{Math.round(loan.amount_paid).toLocaleString()}</span>
                            <span className="text-rose-500">Left: ₹{Math.round(loan.amount_remaining).toLocaleString()}</span>
                        </div>
                        <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-800 rounded-full transition-all duration-1000" style={{ width: `${loan.progress}%` }}></div>
                        </div>
                        <p className="text-center text-xs font-bold text-stone-400">{loan.months_paid} of {loan.tenure_months} months completed</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}