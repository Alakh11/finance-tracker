import { Sparkles, TrendingUp, TrendingDown, Info } from 'lucide-react';

export default function SmartInsights({ prediction, insights }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Prediction Card */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-xl flex flex-col justify-center">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Expense Prediction</h3>
          </div>
          <p className="text-4xl font-black mb-3">₹{prediction?.predicted_spend?.toLocaleString() || '0'}</p>
          <p className="text-sm text-slate-300 leading-relaxed max-w-[80%]">
            Based on your spending habits, this is your expected expense for next month.
          </p>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 justify-center">
        {insights?.length > 0 ? (
          insights.map((insight: any, i: number) => (
            <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 ${
              insight.type === 'warning' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              insight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}>
              <div className={`p-2.5 rounded-full shrink-0 ${
                insight.type === 'warning' ? 'bg-rose-100' :
                insight.type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
              }`}>
                {insight.type === 'warning' ? <TrendingUp size={18} /> : 
                 insight.type === 'success' ? <TrendingDown size={18} /> : <Info size={18} />}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{insight.text}</p>
                <p className="text-xs font-black opacity-60 mt-0.5">{insight.value}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic border border-dashed border-slate-200 rounded-2xl p-6">
            <Info className="w-6 h-6 mb-2 opacity-50" />
            Not enough data for insights yet.
          </div>
        )}
      </div>
    </div>
  );
}