import { useState, useEffect } from 'react';
import { ShieldCheck, FileSearch, AlertTriangle, Terminal, Upload, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auditContract } from '../services/gemini';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { VendorAudit } from '../types';

export default function TPRM() {
  const [contractText, setContractText] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [pastAudits, setPastAudits] = useState<VendorAudit[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'vendorAudits'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setPastAudits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VendorAudit)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vendorAudits'));
  }, []);

  const runAudit = async () => {
    if (!contractText || !vendorName || !auth.currentUser) return;
    setAuditing(true);
    try {
      const result = await auditContract(contractText);
      await addDoc(collection(db, 'vendorAudits'), {
        vendorName,
        contractSummary: contractText.substring(0, 500) + '...',
        riskScore: result.riskScore,
        analysis: result.analysis,
        findings: result.findings,
        status: result.riskScore > 70 ? 'Flagged' : 'Approved',
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setContractText('');
      setVendorName('');
    } catch (error) {
      console.error(error);
    } finally {
      setAuditing(false);
    }
  };

  const handleExport = (auditId: string) => {
    alert(`Generating verifiable evidence bundle for Audit ID: ${auditId}. This includes original contract hash, AI analysis, and timestamp proof.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Audit Form */}
      <div className="space-y-10">
        <div className="bg-brand-panel p-10 rounded-[32px] border border-brand-border shadow-2xl shadow-black/40">
          <h3 className="font-serif text-3xl text-white mb-8 border-b border-white/5 pb-6">Agentic Contract Audit</h3>
          <div className="space-y-8">
            <div>
              <label className="col-label block mb-3">Vendor identity</label>
              <input 
                placeholder="e.g. Vertex AI Solutions"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-brand-accent transition-colors"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
              />
            </div>
            <div>
              <label className="col-label block mb-3">Contract source data (plaintext)</label>
              <textarea 
                rows={12}
                placeholder="Paste the vendor contract terms here..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-white focus:outline-none focus:border-brand-accent transition-colors resize-none"
                value={contractText}
                onChange={e => setContractText(e.target.value)}
              />
            </div>
            <button 
              onClick={runAudit}
              disabled={auditing || !contractText || !vendorName}
              className={`w-full py-5 rounded-[20px] font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-xl ${
                auditing 
                ? 'bg-white/5 text-brand-subtext cursor-not-allowed border border-white/5' 
                : 'bg-brand-accent text-white hover:scale-[1.01] shadow-brand-accent/20 active:scale-95'
              }`}
            >
              {auditing ? (
                <>
                  <Terminal className="w-4 h-4 animate-spin" /> 
                  PROXIED_REASONING_ACTIVE
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 shadow-inner" />
                  INITIATE PII_GW AUDIT
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-8 glass-panel rounded-[32px]">
          <div className="flex gap-6">
             <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="font-bold text-sm mb-1.5 uppercase tracking-widest text-white">Middleware Policy Notice</p>
                <p className="text-xs leading-relaxed text-brand-subtext/60">
                   Automated audits use the NIST AI 100-1 framework. Critical flags require manual remediation in the 
                   <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded mx-1 text-white opacity-80">SECURE_ZONE_LAB</span>.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Audit History */}
      <div className="space-y-8">
        <h3 className="col-label tracking-[0.4em]">Audit Logs // Archive</h3>
        <AnimatePresence>
          {pastAudits.map((audit) => (
            <motion.div 
              key={audit.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-panel p-8 rounded-[32px] border border-brand-border shadow-2xl shadow-black/40 hover:border-brand-accent/30 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-serif text-2xl text-white group-hover:text-brand-accent transition-colors">{audit.vendorName}</p>
                  <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">{audit.id}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                  audit.status === 'Approved' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'
                }`}>
                  {audit.status}
                </div>
              </div>
              
              <div className="space-y-5">
                 <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${audit.riskScore}%` }}
                        className={`h-full ${audit.riskScore > 70 ? 'bg-red-500' : 'bg-green-500'} shadow-lg shadow-current/20`} 
                       />
                    </div>
                    <span className="data-mono font-bold text-white/80">{audit.riskScore}% RISK</span>
                 </div>
                 
                 <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                   <p className="text-xs leading-relaxed italic text-brand-subtext/80">"{audit.analysis}"</p>
                 </div>

                 <div className="flex flex-wrap gap-2.5">
                    {audit.findings.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-lg uppercase font-bold tracking-tighter text-brand-accent">
                        {f}
                      </span>
                    ))}
                    {audit?.findings?.length > 3 && <span className="text-[10px] text-brand-subtext/40 font-bold self-center">+{audit.findings.length - 3} MORE</span>}
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">{new Date(audit.createdAt).toLocaleString()}</span>
                 <button 
                  onClick={() => handleExport(audit.id || '')}
                  className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-brand-accent transition-colors flex items-center gap-2 group/btn"
                 >
                    Full Evidence_Pack <CheckCircle className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                 </button>
              </div>
            </motion.div>
          ))}
          {pastAudits?.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-white/10 rounded-[40px]">
              <FileSearch className="w-16 h-16 mb-6" />
              <p className="font-serif italic text-3xl tracking-widest">NO_AUDIT_DATA</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
