import { useState } from 'react';
import axios from 'axios';
import { useRouter } from '@tanstack/react-router';

interface Props {
  categories: any[];
  onClose: () => void;
  userEmail: string;
}

export default function BudgetForm({ categories, onClose, userEmail }: Props) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !amount) return;
    setLoading(true);

    try {
        await axios.post(`${API_URL}/budgets`, {
            user_email: userEmail,
            category_id: parseInt(selectedCat),
            amount: parseFloat(amount)
        });
        setAmount('');
        router.invalidate(); 
        onClose();
    } catch (error) {
        alert("Failed to save budget");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-stone-900 p-6 rounded-[2rem] text-white animate-in slide-in-from-top-4 shadow-xl mb-8">
        <h3 className="font-bold text-lg mb-4">Set Monthly Limit</h3>
        <form onSubmit={handleSaveBudget} className="flex flex-col md:flex-row gap-4">
            <select 
               value={selectedCat} 
               onChange={(e) => setSelectedCat(e.target.value)}
               className="bg-stone-800 border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 flex-1"
               required
            >
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
            </select>
            <input 
               type="number" 
               placeholder="Amount (e.g. 5000)" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               className="bg-stone-800 border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 flex-1"
               required
            />
            <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save'}
            </button>
        </form>
    </div>
  );
}