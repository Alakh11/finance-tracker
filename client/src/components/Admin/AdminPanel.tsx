import { useLoaderData } from '@tanstack/react-router';
import { Users, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminPanel() {
  const { users, stats } = useLoaderData({ from: '/admin' });
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.mobile && u.mobile.includes(search))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-stone-800 dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8 text-indigo-600" /> Admin Panel
            </h2>
            <p className="text-stone-500 dark:text-slate-400">Overview of all registered users.</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
            <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-stone-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase text-stone-400">Total Users</p>
                <p className="text-2xl font-black text-stone-800 dark:text-white">{stats.total_users}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-stone-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase text-stone-400">Transactions</p>
                <p className="text-2xl font-black text-indigo-600">{stats.total_transactions}</p>
            </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-stone-100 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center bg-stone-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-stone-800 dark:text-white flex items-center gap-2">
                  <Users size={18} /> User List
              </h3>
              <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    placeholder="Search name, email..." 
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-stone-50 dark:bg-slate-800 text-stone-500 dark:text-slate-400 text-xs uppercase font-bold">
                      <tr>
                          <th className="p-5">User</th>
                          <th className="p-5">Contact Info</th>
                          <th className="p-5 text-center">Status</th>
                          <th className="p-5 text-right">Joined</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                      {filteredUsers.map((user: any) => (
                          <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-slate-800/50 transition">
                              <td className="p-5">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                          {user.profile_pic ? <img src={user.profile_pic} className="w-full h-full rounded-full" /> : user.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-stone-800 dark:text-white">{user.name}</p>
                                          <p className="text-xs text-stone-400">ID: #{user.id}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-5 text-sm font-medium text-stone-600 dark:text-slate-300">
                                  {user.email || user.mobile}
                              </td>
                              <td className="p-5 text-center">
                                  {user.is_verified ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                          <CheckCircle2 size={12} /> Verified
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 text-xs font-bold">
                                          <XCircle size={12} /> Pending
                                      </span>
                                  )}
                              </td>
                              <td className="p-5 text-right text-sm text-stone-500 dark:text-slate-400">
                                  {new Date(user.created_at).toLocaleDateString()}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}