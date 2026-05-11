import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Risk } from '../types';
import { AlertCircle, Plus, Info, MoveDiagonal, CheckCircle2, TrendingUp, Activity, Database, Sparkles, X, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logSystemEvent } from '../lib/logger';
import { generateGRCSolution } from '../services/gemini';

export default function RiskRegistry() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [remediating, setRemediating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
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
      const riskData = {
        ...newRisk,
        ownerId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'risks'), riskData);
      
      await logSystemEvent(
        `Risk Identified: ${newRisk.title}`,
        'RISK_ASSESSMENT',
        'success',
        `New risk logged with inherent score of ${Number(newRisk.inherentImpact)! * Number(newRisk.inherentLikelihood)!}`,
        docRef.id
      );

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

  const handleRemediate = async (risk: Risk) => {
    setSelectedRisk(risk);
    setRemediating(true);
    setAiSuggestion(null);
    
    try {
      const suggestion = await generateGRCSolution(
        "TrustDesk Lab", 
        "Cybersecurity Risk Management", 
        `Risk: ${risk.title}. Description: ${risk.description}. Inherent Score: ${risk.inherentImpact * risk.inherentLikelihood}`
      );
      setAiSuggestion(suggestion);
      
      await logSystemEvent(
        `AI Remediation Requested for: ${risk.title}`,
        'AI_AUDIT',
        'success',
        `Gemini generated controls: ${suggestion.controls?.join(', ')}`,
        risk.id
      );
    } catch (error) {
      console.error("AI Remediation failed:", error);
    } finally {
      setRemediating(false);
    }
  };

  const updateStatus = async (riskId: string, newStatus: Risk['status']) => {
    try {
      await updateDoc(doc(db, 'risks', riskId), { 
        status: newStatus,
        residualImpact: newStatus === 'Remediated' ? 1 : 2,
        residualLikelihood: newStatus === 'Remediated' ? 1 : 2
      });
      
      await logSystemEvent(
        `Risk Status Updated: ${newStatus}`,
        'RISK_ASSESSMENT',
        'success',
        `Risk ID ${riskId} moved to ${newStatus}`,
        riskId
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `risks/${riskId}`);
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
              onClick={() => handleRemediate(risk)}
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

      <AnimatePresence>
        {(isAdding || selectedRisk) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000]/60 backdrop-blur-xl">
            {isAdding ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-brand-panel w-full max-w-xl rounded-[40px] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative border border-white/5"
              >
                <button 
                  onClick={() => setIsAdding(false)}
                  className="absolute right-8 top-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
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
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-brand-panel w-full max-w-4xl rounded-[48px] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative border border-white/5 flex gap-12"
              >
                <div className="flex-1 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-[0.3em] mb-2 block">Risk_Dossier_ID: {selectedRisk?.id?.slice(0, 12)}</span>
                      <h3 className="font-serif text-4xl text-white">{selectedRisk?.title}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedRisk(null)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <p className="col-label">Contextual Analysis</p>
                    <p className="text-brand-subtext leading-relaxed italic">"{selectedRisk?.description}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="col-label mb-3">Inherent Risk Matrix</p>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-serif text-2xl ${getRiskColor(selectedRisk!.inherentImpact, selectedRisk!.inherentLikelihood)}`}>
                          {selectedRisk!.inherentImpact * selectedRisk!.inherentLikelihood}
                        </div>
                        <div className="text-[10px] font-mono text-brand-subtext/60 leading-tight">
                          Impact: {selectedRisk?.inherentImpact}<br />
                          Likelihood: {selectedRisk?.inherentLikelihood}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="col-label mb-3">Post-Mitigation Status</p>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-serif text-2xl ${getRiskColor(selectedRisk!.residualImpact, selectedRisk!.residualLikelihood)}`}>
                          {selectedRisk!.residualImpact * selectedRisk!.residualLikelihood}
                        </div>
                        <div className="text-[10px] font-mono text-brand-subtext/60 leading-tight uppercase tracking-widest font-bold">
                          {selectedRisk?.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    {['Identified', 'Mitigating', 'Remediated', 'Accepted'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedRisk!.id!, status as any)}
                        className={`flex-1 py-4 px-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest border transition-all ${
                          selectedRisk?.status === status 
                          ? 'bg-brand-accent text-white border-brand-accent' 
                          : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-80 space-y-6">
                   <div className="bg-brand-accent p-8 rounded-[32px] text-white space-y-6 relative overflow-hidden h-full flex flex-col">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-accent shadow-lg">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="font-serif text-xl italic">AI_Remediation</h4>
                      </div>

                      {remediating ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 relative z-10">
                           <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                           <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Cortex_Reasoning...</p>
                        </div>
                      ) : aiSuggestion ? (
                        <div className="flex-1 space-y-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                           <div className="space-y-3">
                             <p className="text-[9px] uppercase font-bold text-white/50 tracking-widest">Recommended Controls</p>
                             <ul className="space-y-2">
                               {aiSuggestion.controls?.map((c: string, i: number) => (
                                 <li key={i} className="text-xs flex gap-2">
                                   <ArrowRight className="w-3 h-3 shrink-0 mt-0.5" />
                                   <span>{c}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                           <div className="p-4 bg-black/20 rounded-2xl border border-white/10 space-y-2">
                             <p className="text-[9px] uppercase font-bold text-white/50 tracking-widest flex gap-2">
                               <Shield className="w-3 h-3" /> NIST Mapping
                             </p>
                             <p className="text-[10px] leading-relaxed italic opacity-80">
                               Matches NIST AI RMF Manage criteria for technical robustness.
                             </p>
                           </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10">
                           <p className="text-xs text-white/60 leading-relaxed">Let TrustDesk AI generate a specific control strategy for this finding.</p>
                           <button 
                             onClick={() => handleRemediate(selectedRisk!)}
                             className="w-full py-4 bg-white text-brand-accent rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                           >
                              Generate Strategy
                           </button>
                        </div>
                      )}

                      <div className="pt-6 border-t border-white/10 mt-auto flex justify-between items-center relative z-10">
                         <span className="text-[8px] font-mono text-white/40 uppercase">v4.1.Neural</span>
                         <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white/40" />
                            <div className="w-1 h-1 rounded-full bg-white/40" />
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
