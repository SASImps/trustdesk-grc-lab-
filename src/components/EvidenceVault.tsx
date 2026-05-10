import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Evidence } from '../types';
import { ShieldCheck, FileText, Lock, CheckCircle2, Search, ExternalLink, Download, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function EvidenceVault() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'evidence'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (s) => {
      setEvidence(s.docs.map(d => ({ id: d.id, ...d.data() } as Evidence)));
      setLoading(false);
    });
    
    return unsub;
  }, []);

  const filteredEvidence = evidence.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    if (!selectedEvidence) return;
    const blob = new Blob([JSON.stringify(selectedEvidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-${selectedEvidence.id || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="font-serif text-6xl text-white mb-6">Evidence <span className="italic">Vault.</span></h1>
          <p className="text-xl text-brand-subtext leading-relaxed">
            Immutable, cryptographically signed records of all GRC lab operations. 
            These artifacts serve as verifiable proof of technical control assessment.
          </p>
        </div>
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40 group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search artifacts..."
            className="w-full bg-brand-panel border border-brand-border rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-brand-accent transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Artifact List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-panel rounded-[40px] border border-brand-border overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
               <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-brand-subtext/40">Verified_Artifact_Registry</span>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-500/80 uppercase">Node_Connected</span>
               </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredEvidence.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedEvidence(item)}
                  className={`w-full p-8 text-left hover:bg-white/[0.02] transition-colors flex items-center gap-8 group ${selectedEvidence?.id === item.id ? 'bg-white/[0.03]' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    item.type === 'POLICY' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    item.type === 'AUDIT' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                    'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
                  }`}>
                    {item.type === 'POLICY' ? <FileText className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-serif text-xl text-white truncate">{item.title}</h3>
                      <span className="text-[8px] font-mono px-2 py-1 bg-white/5 border border-white/5 rounded-md text-brand-subtext/40 uppercase tracking-tighter">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-brand-subtext truncate opacity-60">Verified by {item.verifier}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-brand-subtext/40 mb-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                    <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-green-500 uppercase tracking-tighter">
                       <Lock className="w-3 h-3" /> Signed
                    </div>
                  </div>
                </button>
              ))}

              {filteredEvidence.length === 0 && !loading && (
                <div className="p-20 text-center opacity-20">
                  <Fingerprint className="w-20 h-20 mx-auto mb-6" />
                  <p className="font-serif italic text-2xl">No artifacts found</p>
                  <p className="text-sm mt-2">Complete lab modules to generate signed evidence.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Artifact Detail View */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {selectedEvidence ? (
              <motion.div 
                key={selectedEvidence.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-brand-panel rounded-[48px] border border-brand-border p-10 shadow-2xl space-y-10 sticky top-12"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-brand-accent border border-white/10">
                       <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest mb-1">Signature_Status</p>
                       <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold rounded-full">VALIDATED</span>
                    </div>
                  </div>
                  <h2 className="font-serif text-3xl text-white">{selectedEvidence.title}</h2>
                  <p className="text-sm text-brand-subtext leading-relaxed italic">"{selectedEvidence.description}"</p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <p className="col-label uppercase text-[9px] tracking-widest">Hash (SHA-256)</p>
                    <p className="font-mono text-[10px] text-brand-accent break-all leading-relaxed">{selectedEvidence.hash}</p>
                    
                    <div className="h-px bg-white/5 my-4" />
                    
                    <p className="col-label uppercase text-[9px] tracking-widest">Digital Signature</p>
                    <p className="font-mono text-[10px] text-brand-subtext/60 break-all leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {selectedEvidence.signature}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[9px] text-brand-subtext/40 uppercase tracking-widest mb-1">Verifier_ID</p>
                       <p className="text-xs font-bold text-white">{selectedEvidence.verifier}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[9px] text-brand-subtext/40 uppercase tracking-widest mb-1">Timestamp</p>
                       <p className="text-xs font-bold text-white">{new Date(selectedEvidence.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleExport}
                    className="w-full py-5 bg-brand-accent text-white rounded-[24px] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-brand-accent/20"
                  >
                     <Download className="w-4 h-4" /> Export Signed JSON
                  </button>
                  <button className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                     <ExternalLink className="w-4 h-4" /> View On Chain Registry
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[48px] p-20 flex flex-col items-center justify-center text-center opacity-20 h-[600px]">
                 <Lock className="w-20 h-20 mb-8" />
                 <p className="font-serif italic text-2xl tracking-widest">SELECT_ARTIFACT</p>
                 <p className="text-[10px] font-mono mt-4 uppercase">Integrity check required</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
