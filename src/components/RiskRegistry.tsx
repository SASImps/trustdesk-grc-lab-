import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Risk } from '../types';
import { AlertCircle, Plus, Info, MoveDiagonal, CheckCircle2, TrendingUp, Activity, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function RiskRegistry() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRisk, setNewRisk] = useState<Partial<Risk>>({
    title: '',
    description: '',
    inherentImpact: 3,
    inherentLikelihood: 3,
    residualImpact: 2,
    residualLikelihood: 2,
    status: 'Identified'
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'risks'), 
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setRisks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Risk)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'risks'));
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'risks'), {
        ...newRisk,
        ownerId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewRisk({
        title: '',
        description: '',
        inherentImpact: 3,
        inherentLikelihood: 3,
        residualImpact: 2,
        residualLikelihood: 2,
        status: 'Identified'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'risks');
    }
  };

  const getRiskColor = (impact: number, likelihood: number) => {
    const score = impact * likelihood;
    if (score >= 15) return 'bg-red-500';
    if (score >= 8) return 'bg-orange-400';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-12">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-brand-panel p-10 rounded-[32px] border border-brand-border shadow-2xl shadow-black/20">
          <p className="col-label mb-3">Total High Exposure</p>
          <div className="flex items-end justify-between">
            <h3 className="text-5xl font-serif text-red-500">{risks?.filter(r => r.inherentImpact * r.inherentLikelihood >= 15).length || 0}</h3>
            <TrendingUp className="w-6 h-6 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-brand-panel p-10 rounded-[32px] border border-brand-border shadow-2xl shadow-black/20">
          <p className="col-label mb-3">Mitigation Progress</p>
          <div className="flex items-end justify-between">
            <h3 className="text-5xl font-serif text-white">{Math.round(((risks?.filter(r => r.status === 'Remediated').length || 0) / (risks?.length || 1)) * 100)}%</h3>
            <CheckCircle2 className="w-6 h-6 text-brand-accent opacity-20" />
          </div>
        </div>
        <div className="bg-brand-panel p-10 rounded-[32px] border border-brand-border shadow-2xl shadow-black/40">
          <p className="col-label mb-3">Avg. Residual Risk</p>
          <div className="flex items-end justify-between">
            <h3 className="text-5xl font-serif text-white">{(risks?.reduce((acc, r) => acc + (r.residualImpact * r.residualLikelihood), 0) / (risks?.length || 1)).toFixed(1)}</h3>
            <Activity className="w-6 h-6 text-brand-accent opacity-20" />
          </div>
        </div>
      </div>

      {/* Control Pane */}
      <div className="flex justify-between items-center bg-brand-panel/50 p-6 rounded-[24px] border border-brand-border backdrop-blur-md">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 bg-brand-accent text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-accent/20"
        >
          <Plus className="w-4 h-4" /> Log New Risk
        </button>
        <div className="flex items-center gap-3 px-6 py-2.5 bg-white/5 rounded-full border border-white/5">
           <Info className="w-4 h-4 text-brand-accent" />
           <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-subtext/60">Live Sync Enabled // DB_NODE_01</span>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-brand-panel rounded-[32px] border border-brand-border shadow-2xl shadow-black/40 overflow-hidden">
        <div className="grid grid-cols-6 p-6 bg-white/[0.02] text-brand-subtext font-mono text-[10px] uppercase tracking-[0.2em] border-b border-brand-border">
          <div className="col-span-2 px-6">RISK_ENTITY_IDENTIFIER</div>
          <div className="text-center font-bold">INHERENT</div>
          <div className="text-center font-bold">RESIDUAL</div>
          <div className="text-center font-bold">STATUS</div>
          <div className="text-right px-6 font-bold">DATA_MTD</div>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {risks.map((risk) => (
            <motion.div 
              layout
              key={risk.id} 
              className="grid grid-cols-6 p-8 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
              <div className="col-span-2 px-6">
                <p className="font-bold text-sm mb-1.5 text-white group-hover:text-brand-accent transition-colors">{risk.title}</p>
                <p className="text-xs text-brand-subtext/60 line-clamp-1 italic">"{risk.description}"</p>
              </div>
              <div className="flex flex-col justify-center items-center gap-1.5">
                <div className={`w-8 h-1.5 rounded-full ${getRiskColor(risk.inherentImpact, risk.inherentLikelihood)} opacity-80`} />
                <span className="data-mono text-[10px] font-bold text-brand-subtext/80">{(risk.inherentImpact * risk.inherentLikelihood).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex flex-col justify-center items-center gap-1.5">
                <div className={`w-8 h-1.5 rounded-full ${getRiskColor(risk.residualImpact, risk.residualLikelihood)} opacity-80`} />
                <span className="data-mono text-[10px] font-bold text-brand-subtext/80">{(risk.residualImpact * risk.residualLikelihood).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex justify-center">
                <span className={`text-[9px] uppercase font-bold px-3 py-1.5 rounded-xl border tracking-widest ${
                  risk.status === 'Remediated' ? 'border-green-500/30 text-green-500 bg-green-500/10' :
                  risk.status === 'Identified' ? 'border-red-500/30 text-red-500 bg-red-500/10' : 
                  'border-orange-500/30 text-orange-500 bg-orange-500/10'
                }`}>
                  {risk.status}
                </span>
              </div>
              <div className="text-right px-6">
                <p className="data-mono text-[10px] text-brand-subtext/40">{new Date(risk.createdAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
          {risks.length === 0 && (
            <div className="p-24 text-center">
              <Database className="w-16 h-16 text-brand-subtext/10 mx-auto mb-6" />
              <div className="text-brand-subtext/40 font-serif italic text-2xl uppercase tracking-widest">
                Zero records detected in current environment
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000]/60 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-panel w-full max-w-xl rounded-[40px] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative border border-white/5"
          >
            <h3 className="font-serif text-3xl text-white mb-8 border-b border-white/5 pb-6">Log Compliance Finding</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="col-label block mb-2.5">Risk Identification Label</label>
                <input 
                  autoFocus
                  required
                  placeholder="e.g. Broken Authentication in Auth0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-brand-accent transition-colors"
                  value={newRisk.title}
                  onChange={e => setNewRisk({...newRisk, title: e.target.value})}
                />
              </div>
              <div>
                <label className="col-label block mb-2.5">Technical Context & Meta_Data</label>
                <textarea 
                  rows={3}
                  placeholder="Describe the vulnerability or finding..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-brand-accent transition-colors resize-none"
                  value={newRisk.description}
                  onChange={e => setNewRisk({...newRisk, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="col-label block mb-2.5 text-red-400">Inherent Impact (1-5)</label>
                  <input type="number" min="1" max="5" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white" value={newRisk.inherentImpact} onChange={e => setNewRisk({...newRisk, inherentImpact: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="col-label block mb-2.5 text-red-400">Inherent Likelihood (1-5)</label>
                  <input type="number" min="1" max="5" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white" value={newRisk.inherentLikelihood} onChange={e => setNewRisk({...newRisk, inherentLikelihood: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-brand-accent text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-accent/20">Commit Entry</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
