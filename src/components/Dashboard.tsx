import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { db, collection, query, onSnapshot, orderBy, limit, handleFirestoreError, OperationType } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ControlAction {
  id: string;
  action: string;
  status: string;
  details: string;
  timestamp: any;
}

export function DashboardOverview() {
  const [actions, setActions] = useState<ControlAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'controlActions'), 
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ControlAction[];
      setActions(actionsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'controlActions');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Risk Score', value: '72/100', color: 'emerald', trend: '+5%' },
          { label: 'Pending Evidence', value: '14', color: 'amber', trend: '-2' },
          { label: 'Active Controls', value: '128', color: 'blue', trend: '+12' },
          { label: 'Alerts (24h)', value: '3', color: 'rose', trend: 'Severe' },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-700 transition-all group">
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-3xl font-bold text-slate-100">{stat.value}</h3>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded border",
                stat.color === 'emerald' && "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                stat.color === 'amber' && "text-amber-400 border-amber-500/20 bg-amber-500/5",
                stat.color === 'blue' && "text-blue-400 border-blue-500/20 bg-blue-500/5",
                stat.color === 'rose' && "text-rose-400 border-rose-500/20 bg-rose-500/5",
              )}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '60%' }}
                 className={cn(
                   "h-full",
                   stat.color === 'emerald' && "bg-emerald-500",
                   stat.color === 'amber' && "bg-amber-500",
                   stat.color === 'blue' && "bg-blue-500",
                   stat.color === 'rose' && "bg-rose-500",
                 )}
               />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Compliance Health</h3>
            <select className="bg-slate-800 border-none rounded-md text-xs px-3 py-1 text-slate-300 outline-none cursor-pointer">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-64 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
             <Activity size={32} className="animate-pulse opacity-50 mb-3 text-emerald-500" />
             <span className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Aggregating Risk Intelligence...</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="font-bold text-lg">AI Sentinel Insights</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 opacity-30">
                <Clock className="animate-spin mr-2" size={14} />
                <span className="text-[10px] font-mono">Syncing Logs...</span>
              </div>
            ) : actions.length > 0 ? (
              actions.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:bg-slate-800/50 transition-all cursor-pointer group">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-2 shrink-0 group-hover:scale-150 transition-all",
                    item.status === 'success' && "bg-emerald-500",
                    item.status === 'warning' && "bg-amber-500",
                    item.status === 'error' && "bg-rose-500",
                    !['success', 'warning', 'error'].includes(item.status) && "bg-blue-500"
                  )} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.action}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.details}</p>
                    <span className="text-[9px] text-slate-600 mt-1 block font-mono">
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl opacity-50">
                <ShieldCheck className="mx-auto mb-2 text-slate-700" size={24} />
                <p className="text-[10px] uppercase tracking-widest text-slate-500">All systems green</p>
              </div>
            )}
          </div>
          <button className="mt-auto w-full py-2.5 text-xs text-emerald-400 font-semibold border border-emerald-500/20 rounded-xl hover:bg-emerald-500/5 transition-all">
            Generate Executive Summary
          </button>
        </div>
      </div>
    </div>
  );
}
