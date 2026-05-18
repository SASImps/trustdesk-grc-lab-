import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { db, collection, query, onSnapshot, orderBy, handleFirestoreError, OperationType, addDoc, Timestamp, auth } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Risk {
  id: string;
  title: string;
  impact: 'Low' | 'Moderate' | 'High' | 'Critical';
  owner: string;
  status: 'Open' | 'Pending' | 'Mitigated';
  compliance: string;
}

export function RiskRegistry() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: '', impact: 'Moderate', owner: 'Unassigned', status: 'Open', compliance: 'N/A' });

  useEffect(() => {
    const q = query(collection(db, 'risks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const risksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Risk[];
      setRisks(risksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'risks');
    });

    return () => unsubscribe();
  }, []);

  const handleAddRisk = async () => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'risks'), {
        ...newRisk,
        ownerId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      setIsAdding(false);
      setNewRisk({ title: '', impact: 'Moderate', owner: 'Unassigned', status: 'Open', compliance: 'N/A' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'risks');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Activity size={32} className="animate-spin text-emerald-500 mr-3" />
      <span>Loading Risk Intelligence...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Risk Management</h1>
          <p className="text-sm text-slate-500">Track and respond to organizational vulnerabilities.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          Log Risk
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-lg">New Risk Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Risk Title" 
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
              value={newRisk.title}
              onChange={e => setNewRisk({...newRisk, title: e.target.value})}
            />
            <select 
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
              value={newRisk.impact}
              onChange={e => setNewRisk({...newRisk, impact: e.target.value as any})}
            >
              <option value="Low">Low Impact</option>
              <option value="Moderate">Moderate Impact</option>
              <option value="High">High Impact</option>
              <option value="Critical">Critical Impact</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={handleAddRisk} className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all">Submit to Registry</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Description</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Impact</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{risk.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold",
                    risk.impact === 'Critical' && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                    risk.impact === 'High' && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                    risk.impact === 'Moderate' && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                    risk.impact === 'Low' && "bg-slate-500/10 text-slate-400 border border-slate-500/20",
                  )}>
                    {risk.impact}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{risk.owner}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      risk.status === 'Mitigated' && "bg-emerald-500",
                      risk.status === 'Pending' && "bg-amber-500",
                      risk.status === 'Open' && "bg-rose-500",
                    )} />
                    <span className="text-xs text-slate-200 font-medium">{risk.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-mono tracking-tighter">{risk.compliance}</td>
              </tr>
            ))}
            {risks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No risks logged in the registry yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
