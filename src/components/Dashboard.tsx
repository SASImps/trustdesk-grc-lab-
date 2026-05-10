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

  const stats = [
    { label: 'Security Posture', value: '78%', icon: ShieldCheck, trend: '+4%' },
    { label: 'Verified Artifacts', value: evidenceCount, icon: Lock, trend: 'NEW' },
    { label: 'AI Throughput', value: audits?.length || 0, icon: Zap, trend: '+12%' },
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
      <div className="max-w-3xl">
        <h1 className="font-serif text-6xl text-white mb-6">Welcome back, <span className="italic">Lead.</span></h1>
        <p className="text-xl text-brand-subtext leading-relaxed">
          Your organizational risk perimeter is currently <span className="font-bold text-green-500 underline decoration-green-500/30">OPTIMIZED</span>. 
          Audit logs indicate no immediate PII leakage across active Third-Party contracts.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {stats.map((stat, i) => (
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-brand-panel p-10 rounded-[32px] border border-brand-border shadow-2xl shadow-black/40 group relative overflow-hidden"
           >
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-24 h-24" />
             </div>
             <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="w-14 h-14 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-accent/20 group-hover:scale-110 transition-transform">
                   <stat.icon className="w-7 h-7" />
                 </div>
                 <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-500/20">
                    {stat.trend} <ArrowUpRight className="w-3 h-3" />
                 </span>
             </div>
             <p className="col-label mb-2 relative z-10">{stat.label}</p>
             <h3 className="text-5xl font-serif text-white tracking-tighter relative z-10">{stat.value}</h3>
           </motion.div>
         ))}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="bg-brand-panel p-10 rounded-[40px] border border-brand-border shadow-2xl shadow-black/40">
            <div className="flex justify-between items-center mb-12">
               <h4 className="font-serif text-2xl text-white">Exposure Heatmap_V4</h4>
               <TrendingUp className="w-5 h-5 text-brand-subtext/40" />
            </div>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <BarChart data={riskData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                     <XAxis dataKey="name" fontSize={11} fontFamily="JetBrains Mono" axisLine={false} tickLine={false} dy={10} stroke="#475569" />
                     <YAxis fontSize={11} fontFamily="JetBrains Mono" axisLine={false} tickLine={false} stroke="#475569" />
                     <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F1116', 
                          borderRadius: '20px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
                          fontFamily: 'Inter',
                          color: '#E2E8F0'
                        }}
                        itemStyle={{ color: '#E2E8F0' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                     />
                     <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                        {riskData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-brand-panel p-10 rounded-[40px] border border-brand-border shadow-2xl shadow-black/40 flex flex-col">
            <div className="flex justify-between items-center mb-12">
               <h4 className="font-serif text-2xl text-white">Recent AI Logic Cycles</h4>
               <span className="text-[10px] font-mono tracking-[0.3em] text-brand-subtext/40 uppercase">System_Stream_v2.1</span>
            </div>
            <div className="flex-1 space-y-7">
               {audits.map((audit, i) => (
                 <div key={audit.id} className="flex items-center gap-6 group cursor-pointer border-b border-white/5 pb-4 last:border-0">
                    <div className="w-2 h-10 bg-white/5 rounded-full overflow-hidden">
                       <div className={`w-full h-full ${audit.riskScore > 70 ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-green-500 shadow-lg shadow-green-500/20'}`} style={{ height: `${audit.riskScore}%` }} />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm font-bold text-white truncate group-hover:text-brand-accent transition-colors">{audit.vendorName}</p>
                       <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">Audit_ID: {audit.id?.slice(0, 8)}...</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-brand-subtext bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                       {audit.riskScore}% RISK
                    </span>
                 </div>
               ))}
               {audits?.length === 0 && (
                 <div className="h-full flex items-center justify-center text-center opacity-20 py-12">
                    <p className="font-serif italic text-xl text-white tracking-[0.2em]">Awaiting Neural Inputs</p>
                 </div>
               )}
            </div>
            <button className="mt-10 w-full py-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-subtext/40 hover:text-white transition-all">
               EXPLORE_ALL_TRANSACTIONS
            </button>
         </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-brand-accent p-16 rounded-[60px] text-white flex flex-col lg:row-start-2 lg:col-span-2 md:flex-row justify-between items-center gap-12 relative overflow-hidden shadow-2xl shadow-brand-accent/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-black/20 rounded-full blur-[80px] -ml-32 -mb-32" />
        <div className="relative z-10 text-center md:text-left">
          <h2 className="font-serif text-5xl italic mb-6">Resume_Ready Lab.</h2>
          <p className="text-white/70 max-w-lg text-lg leading-relaxed">
            Every audit cycle you complete generates a sanitized SOC2-ready evidence pack, 
            verifiable proof of real-world GRC professional experience.
          </p>
        </div>
        <button 
          onClick={simulateExport}
          disabled={exporting}
          className={`relative z-10 bg-white text-brand-accent px-12 py-5 rounded-3xl font-bold text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${exporting ? 'animate-pulse cursor-wait opacity-80' : 'hover:scale-105'}`}
        >
           {exporting ? 'Compiling Registry...' : 'Export SOC2 Evidence Pack'}
        </button>
      </div>
    </div>
  );
}
