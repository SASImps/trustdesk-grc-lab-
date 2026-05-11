import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ControlAction } from '../types';
import { Activity, Terminal, ShieldAlert, Cpu, Hash, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SystemLogs() {
  const [logs, setLogs] = useState<ControlAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'controlActions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (s) => {
      setLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as ControlAction)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'controlActions'));

    return unsub;
  }, []);

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-2xl">
        <h1 className="font-serif text-6xl text-white mb-6">System <span className="italic">Logs.</span></h1>
        <p className="text-xl text-brand-subtext leading-relaxed">
          Real-time forensic stream of all platform operations, control assessments, and policy evolutions.
        </p>
      </div>

      <div className="bg-black/90 border border-brand-border rounded-[48px] overflow-hidden shadow-2xl relative">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 flex items-center justify-center text-brand-accent animate-pulse">
                 <Terminal className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-[0.3em]">Cortex_Audit_Stream</p>
                <p className="text-[9px] font-mono text-green-500/60 uppercase">System Health: Nominal</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Active Nodes</span>
                <span className="text-xs font-mono text-brand-accent">AIS-LAB-G3</span>
              </div>
              <div className="h-10 w-px bg-white/5" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Event Count</span>
                <span className="text-xs font-mono text-brand-accent">{logs?.length || 0}</span>
              </div>
           </div>
        </div>

        <div className="max-h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar font-mono">
           <div className="divide-y divide-white/5">
              <AnimatePresence>
                {logs.map((log, idx) => (
                  <motion.div
                    key={log.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group flex items-start gap-8 p-6 hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="shrink-0 pt-1">
                       <p className="text-[9px] text-white/20 mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                         log.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                       }`}>
                          {log.status === 'success' ? <Activity className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                       </div>
                    </div>

                    <div className="flex-1 space-y-3">
                       <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20 uppercase tracking-tighter">
                             {log.type}
                          </span>
                          <h4 className="text-sm text-white font-bold tracking-tight">{log.action}</h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-2">
                             <p className="text-xs text-brand-subtext/40 italic leading-relaxed break-all">
                                {log?.details?.length > 300 ? `${log.details.slice(0, 300)}...` : (log?.details || '')}
                             </p>
                             {log.type === 'LAB_EXECUTION' && (
                               <div className="flex items-center gap-2 text-[8px] text-brand-accent/60">
                                  <Cpu className="w-3 h-3" />
                                  <span>PROCESSED VIA LLM-V3-FLASH</span>
                               </div>
                             )}
                          </div>
                          
                          <div className="flex flex-col justify-end space-y-2 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                             <div className="flex justify-between items-center text-[8px] uppercase font-bold text-white/20 tracking-widest">
                                <span>Entity_ID</span>
                                <Hash className="w-3 h-3" />
                             </div>
                             <p className="text-[9px] text-brand-subtext/80 truncate font-mono">
                                {log.id?.slice(0, 16)}...
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                       <button className="p-2 hover:bg-white/5 rounded-lg text-brand-subtext transition-all">
                          <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           {logs?.length === 0 && !loading && (
             <div className="p-40 text-center space-y-4">
                <Clock className="w-16 h-16 mx-auto text-brand-subtext/10" />
                <p className="font-serif italic text-xl text-white/40">Quiet on the wire...</p>
                <p className="text-[10px] text-brand-subtext/20 uppercase tracking-widest">Forensic logs pending system activity</p>
             </div>
           )}
        </div>
        
        {/* Console Foot */}
        <div className="p-6 bg-black border-t border-white/5 flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-brand-subtext/40">
           <div className="flex items-center gap-4">
              <span className="text-green-500 font-bold">● NODE_ONLINE</span>
              <span>AES-256-GCM_DECRYPTION_ACTIVE</span>
           </div>
           <p className="italic text-brand-accent/60">TRUSTDESK_SECURITY_KERNEL_v4.1.2</p>
        </div>
      </div>
    </div>
  );
}
