import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, limit, orderBy } from 'firebase/firestore';
import { Risk, VendorAudit, Evidence } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Activity, ShieldCheck, Database, Zap, ArrowUpRight, TrendingUp, Lock, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [audits, setAudits] = useState<VendorAudit[]>([]);
  const [evidenceCount, setEvidenceCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const qR = query(collection(db, 'risks'), where('ownerId', '==', auth.currentUser.uid));
    const qA = query(collection(db, 'vendorAudits'), where('userId', '==', auth.currentUser.uid), limit(5), orderBy('createdAt', 'desc'));
    const qE = query(collection(db, 'evidence'), where('userId', '==', auth.currentUser.uid));
    
    const unsubR = onSnapshot(qR, (s) => setRisks(s.docs.map(d => d.data() as Risk)));
    const unsubA = onSnapshot(qA, (s) => setAudits(s.docs.map(d => d.data() as VendorAudit)));
    const unsubE = onSnapshot(qE, (s) => setEvidenceCount(s.size));
    
    return () => { unsubR(); unsubA(); unsubE(); };
  }, []);

  const riskData = [
    { name: 'High', value: risks.filter(r => r.inherentImpact * r.inherentLikelihood >= 15).length, color: '#ef4444' },
    { name: 'Med', value: risks.filter(r => r.inherentImpact * r.inherentLikelihood < 15 && r.inherentImpact * r.inherentLikelihood >= 8).length, color: '#f59e0b' },
    { name: 'Low', value: risks.filter(r => r.inherentImpact * r.inherentLikelihood < 8).length, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Dynamic Posture Calculation
  const postureScore = Math.min(100, Math.max(0, 
    100 - (risks.filter(r => r.status !== 'Remediated').length * 5) + (evidenceCount * 2)
  ));

  const stats = [
    { label: 'Security Posture', value: `${postureScore}%`, icon: ShieldCheck, trend: postureScore > 75 ? '+4%' : '-2%' },
    { label: 'Verified Artifacts', value: evidenceCount, icon: Lock, trend: 'NEW' },
    { label: 'AI Throughput', value: audits?.length || 0, icon: Zap, trend: audits.length > 0 ? '+12%' : 'STABLE' },
  ];

  const [exporting, setExporting] = useState(false);

  const simulateExport = () => {
    setExporting(true);
    setTimeout(async () => {
      try {
        const qE = query(collection(db, 'evidence'), where('userId', '==', auth.currentUser?.uid));
        const s = await getDocs(qE);
        const evidenceData = s.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const content = JSON.stringify({
          type: 'SOC2_EVIDENCE_PACK',
          generatedBy: auth.currentUser?.email,
          timestamp: new Date().toISOString(),
          verificationStatus: 'TRUSTDESK_VERIFIED',
          evidenceStream: evidenceData
        }, null, 2);

        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trustdesk-soc2-pack-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setExporting(false);
      }
    }, 2000);
  };

  return (
    <div className="space-y-12">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="font-serif text-6xl text-white mb-6">Security <span className="italic">Posture.</span></h1>
          <p className="text-xl text-brand-subtext leading-relaxed">
            Technical oversight of enterprise compliance readiness. This dashboard synthesizes 
            live telemetry from across the lab nodes.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="h-14 px-6 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[8px] font-mono text-brand-subtext/40 uppercase tracking-widest">Global Health</p>
                 <p className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Operational</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
           </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {stats.map((stat, i) => {
           const Icon = stat.icon;
           return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label} 
              className="bg-brand-panel p-10 rounded-[48px] border border-brand-border shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-[100px] -mr-16 -mt-16 group-hover:bg-brand-accent/10 transition-colors" />
              <div className="flex justify-between items-start mb-10 relative z-10">
                 <div className="w-16 h-16 bg-brand-accent rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-accent/20 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-500/20">
                     {stat.trend} <ArrowUpRight className="w-3 h-3" />
                  </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-subtext/40 font-mono mb-2 relative z-10">{stat.label}</p>
              <h3 className="text-5xl font-serif text-white tracking-tighter relative z-10">{stat.value}</h3>
            </motion.div>
           );
         })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Risk Visualizer */}
         <div className="bg-brand-panel p-12 rounded-[48px] border border-brand-border shadow-2xl space-y-10">
            <div className="flex justify-between items-center">
               <h4 className="font-serif text-3xl text-white">Risk Topography</h4>
               <div className="flex items-center gap-2 text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">
                  <Activity className="w-3 h-3 animate-pulse text-brand-accent" /> RT_Telemetry
               </div>
            </div>
            
            <div className="h-80 relative">
               {riskData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={riskData}
                          innerRadius={90}
                          outerRadius={130}
                          paddingAngle={8}
                          dataKey="value"
                       >
                          {riskData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F1116', 
                            borderRadius: '24px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', 
                            fontFamily: 'Inter',
                            color: '#E2E8F0',
                            fontSize: '10px'
                          }}
                          itemStyle={{ color: '#E2E8F0' }}
                       />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                    <Database className="w-16 h-16" />
                    <p className="font-serif italic text-xl">Awaiting Entry Simulation</p>
                 </div>
               )}
               
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-[0.3em]">Aggregate</p>
                  <p className="text-4xl font-serif text-white">{risks.length}</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5">
               {['High', 'Med', 'Low'].map((type) => {
                 const data = riskData.find(d => d.name === type);
                 return (
                   <div key={type} className="text-center group cursor-pointer">
                      <p className="text-[9px] font-bold text-brand-subtext/40 uppercase tracking-widest mb-2 group-hover:text-brand-accent transition-colors">{type}</p>
                      <p className="text-3xl font-serif text-white">{data?.value || 0}</p>
                   </div>
                 );
               })}
            </div>
         </div>

         {/* Right Column: AI Insights & Quick Action */}
         <div className="space-y-12">
            <div className="bg-brand-accent p-12 rounded-[56px] text-white space-y-10 relative overflow-hidden shadow-2xl shadow-brand-accent/30">
               <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40" />
               <div className="absolute left-0 bottom-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] -ml-32 -mb-32" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-brand-accent shadow-2xl">
                       <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-4xl italic">Ready for Audit?</h3>
                  </div>
                  <p className="text-white/80 text-xl leading-relaxed italic max-w-lg">
                    "Current cryptographic evidence sets suggest a 94% probability of passing SOC2 Type II TSC integrity check."
                  </p>
                  <div className="flex gap-4 pt-4">
                     <button 
                        onClick={simulateExport}
                        disabled={exporting}
                        className={`flex-1 py-5 bg-white text-brand-accent rounded-2xl font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 ${exporting ? 'animate-pulse opacity-80' : 'hover:scale-105'}`}
                     >
                        {exporting ? 'Synthesizing...' : 'Generate Vault Export'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-brand-panel p-10 rounded-[48px] border border-brand-border shadow-2xl flex flex-col justify-center gap-8 group hover:border-brand-accent/40 transition-all cursor-pointer">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-brand-subtext group-hover:text-brand-accent transition-colors border border-white/5">
                        <RefreshCcw className="w-8 h-8" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-white mb-1">Cortex Engine Scan</h4>
                        <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest italic">Last Cycle: 4 mins ago</p>
                     </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-brand-subtext/20 group-hover:text-brand-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
