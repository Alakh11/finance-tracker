import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import type { User } from '../types';

export default function CategoryManager({ user }: { user: User }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState({ name: '', color: '#3B82F6', type: 'expense' });
  const API_URL = "https://finance-tracker-q60v.onrender.com";

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = () => axios.get(`${API_URL}/categories/${user.email}`).then(res => setCategories(res.data));

  const addCategory = async () => {
    if(!newCat.name) return;
    try {
        await axios.post(`${API_URL}/categories`, {
            user_email: user.email,
            name: newCat.name,
            color: newCat.color,
            type: newCat.type
        });
        setNewCat({ name: '', color: '#3B82F6', type: 'expense' });
        loadCategories();
    } catch(e) { alert("Error creating category"); }
  };

  const deleteCategory = async (id: number) => {
      if(confirm('Delete this category? ALL associated transactions will be deleted.')) {
          await axios.delete(`${API_URL}/categories/${id}`);
          loadCategories();
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-stone-800">Category Settings</h2>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-50 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Type</label>
                <select className="w-full mt-1 p-3 bg-stone-50 rounded-xl outline-none font-bold" value={newCat.type} onChange={e => setNewCat({...newCat, type: e.target.value})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
            </div>
            <div className="flex-[2]">
                <label className="text-xs font-bold text-stone-400 uppercase">Name</label>
                <input className="w-full mt-1 p-3 bg-stone-50 rounded-xl outline-none font-semibold" placeholder="e.g. Salary, Gym" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Color</label>
                <div className="flex items-center mt-1 h-[50px]">
                    <input type="color" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                </div>
            </div>
            <button onClick={addCategory} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 transition h-[50px]"><Plus size={18} /> Add</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat: any) => (
                <div key={cat.id} className="bg-white p-4 rounded-2xl border border-stone-50 flex justify-between items-center group shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: cat.color }}>{cat.name.charAt(0)}</div>
                        <div>
                            <p className="font-bold text-stone-700">{cat.name}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${cat.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{cat.type}</span>
                        </div>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 size={18} /></button>
                </div>
            ))}
        </div>
    </div>
  );
}