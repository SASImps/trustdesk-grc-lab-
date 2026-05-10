import { useState } from 'react';
import { BookOpen, Search, Map, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FRAMEWORKS = [
  {
    id: 'nist-ai',
    name: 'NIST AI 100-1',
    description: 'Artificial Intelligence Risk Management Framework (AI RMF)',
    categories: [
      { id: 'govern', label: 'GOVERN', color: 'bg-indigo-500' },
      { id: 'map', label: 'MAP', color: 'bg-blue-500' },
      { id: 'measure', label: 'MEASURE', color: 'bg-emerald-500' },
      { id: 'manage', label: 'MANAGE', color: 'bg-orange-500' }
    ],
    controls: [
      { id: 'GOVERN-1.1', title: 'Organizational culture', detail: 'Policies, processes, and procedures are in place to manage AI risks.' },
      { id: 'MAP-1.1', title: 'Internal and external boundaries', detail: 'AI system boundaries and dependencies are clearly defined.' },
      { id: 'MEASURE-1.1', title: 'AI risk metrics', detail: 'Formal metrics for trustworthiness are established and monitored.' }
    ]
  },
  {
    id: 'gdpr',
    name: 'GDPR Article 35',
    description: 'Data Protection Impact Assessment (DPIA) Requirements',
    categories: [
      { id: 'transparency', label: 'Transparency', color: 'bg-blue-600' },
      { id: 'rights', label: 'Data Subject Rights', color: 'bg-purple-600' },
      { id: 'security', label: 'Security of Processing', color: 'bg-red-600' }
    ],
    controls: [
      { id: 'ART-5', title: 'Principles of processing', detail: 'Personal data shall be processed lawfully, fairly and in a transparent manner.' },
      { id: 'ART-32', title: 'Security', detail: 'Technical and organizational measures to ensure a level of security appropriate to the risk.' }
    ]
  },
  {
    id: 'iso-42001',
    name: 'ISO/IEC 42001',
    description: 'Information technology — Artificial intelligence — Management system',
    categories: [
      { id: 'policy', label: 'AI Policy', color: 'bg-teal-500' },
      { id: 'resources', label: 'Resource Mgmt', color: 'bg-cyan-500' },
      { id: 'impact', label: 'AI Impact', color: 'bg-blue-500' }
    ],
    controls: [
      { id: 'B.5.2', title: 'AI system impact assessment', detail: 'The organization shall assess the potential impacts of AI systems on individuals and groups.' },
      { id: 'B.9.3', title: 'Data for AI systems', detail: 'Processes for data acquisition, preparation and governance for AI training.' }
    ]
  },
  {
    id: 'soc2',
    name: 'SOC2 Type II',
    description: 'System and Organization Controls for Trust Services Criteria',
    categories: [
      { id: 'security', label: 'Security', color: 'bg-red-500' },
      { id: 'availability', label: 'Availability', color: 'bg-orange-500' },
      { id: 'confidentiality', label: 'Confidentiality', color: 'bg-blue-500' }
    ],
    controls: [
      { id: 'CC6.1', title: 'Logical Access', detail: 'The entity restricts logical access to information software and infrastructure.' },
      { id: 'CC7.1', title: 'System Monitoring', detail: 'The entity selects, develops and performs ongoing evaluations of controls.' }
    ]
  }
];

export default function GovernanceEngine() {
  const [selectedFramework, setSelectedFramework] = useState(FRAMEWORKS[0]);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'audit' | 'strategy' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [controlStatuses, setControlStatuses] = useState<Record<string, 'Candidate' | 'In Review' | 'Approved'>>({});

  const toggleStatus = (id: string) => {
    setControlStatuses(prev => {
      const current = prev[id] || 'Candidate';
      const next = current === 'Candidate' ? 'In Review' : current === 'In Review' ? 'Approved' : 'Candidate';
      return { ...prev, [id]: next };
    });
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const content = JSON.stringify({ 
        framework: selectedFramework.name, 
        controls: selectedFramework.controls.map(c => ({
          ...c,
          status: controlStatuses[c.id] || 'Candidate'
        })),
        exportedAt: new Date().toISOString(), 
        status: 'VERIFIED' 
      }, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFramework.id}_compliance_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  };

  return (
    <div className="space-y-12 relative">
      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-24 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-panel border border-brand-border rounded-[48px] p-12 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute right-12 top-12">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {activeModal === 'audit' ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-accent">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-3xl text-white">Validated Audit Trail</h3>
                  </div>
                  <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4 font-mono text-[10px] uppercase tracking-widest leading-loose text-brand-subtext/60">
                    <p className="flex justify-between"><span className="text-brand-accent">Hash:</span> 0x8F2A...B9C1</p>
                    <p className="flex justify-between"><span>Timestamp:</span> {new Date().toISOString()}</p>
                    <p className="flex justify-between"><span>Validator:</span> TRUSTDESK_OS_INTERNAL_CORE</p>
                    <div className="h-px bg-white/5 my-4" />
                    <p className="text-green-500 font-bold">» SYSTEM_VERIFICATION_PASS</p>
                  </div>
                  <p className="text-sm text-brand-subtext leading-relaxed italic">
                    "Cryptographic evidence ensures that this control has been verified against immutable logs and cannot be tampered with."
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-accent">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-3xl text-white">System Strategy</h3>
                  </div>
                  <div className="space-y-6 overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar">
                    <div className="space-y-4">
                      <h4 className="text-white font-bold uppercase text-xs tracking-widest">0.1 Objective</h4>
                      <p className="text-sm text-brand-subtext/80 leading-relaxed">To establish a resilient GRC framework that leverages AI-driven automation for real-time compliance monitoring across multi-cloud environments.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-white font-bold uppercase text-xs tracking-widest">0.2 Scope</h4>
                      <p className="text-sm text-brand-subtext/80 leading-relaxed">All enterprise systems processing sensitive customer data or utilizing Large Language Models for automated decision-making.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-white font-bold uppercase text-xs tracking-widest">0.3 Methodology</h4>
                      <p className="text-sm text-brand-subtext/80 leading-relaxed">Continuous assessment via the TrustDesk Lab Modules, mapping technical signals to {selectedFramework.name} controls with AI-assisted evidence generation.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Framework Switcher */}
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {FRAMEWORKS.map(f => (
          <button 
            key={f.id}
            onClick={() => setSelectedFramework(f)}
            className={`flex-shrink-0 p-8 rounded-[32px] border transition-all min-w-[280px] text-left group ${
              selectedFramework.id === f.id 
              ? 'bg-brand-accent text-white border-brand-accent shadow-2xl shadow-brand-accent/20 scale-[1.02]' 
              : 'bg-brand-panel border-brand-border hover:border-white/20'
            }`}
          >
            <p className={`text-[10px] uppercase font-mono tracking-widest mb-3 ${selectedFramework.id === f.id ? 'text-white/60' : 'text-brand-subtext/40'}`}>Standard_ID: {f.id.toUpperCase()}</p>
            <h4 className="font-serif text-2xl font-medium">{f.name}</h4>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-panel p-12 rounded-[40px] border border-brand-border shadow-2xl shadow-black/40">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="font-serif text-4xl text-white mb-4">{selectedFramework.name}</h3>
                <p className="text-brand-subtext max-w-md leading-relaxed italic border-l-2 border-brand-accent/30 pl-6">
                  "{selectedFramework.description}"
                </p>
              </div>
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className={`w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white transition-all shadow-lg active:scale-95 ${
                  downloading ? 'opacity-50' : 'hover:bg-brand-accent hover:border-brand-accent'
                }`}
              >
                 {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
               {selectedFramework.categories.map(cat => (
                 <div key={cat.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                   <div className={`absolute top-0 left-0 w-1 h-full ${cat.color}`} />
                   <p className="text-[10px] font-mono tracking-[0.2em] text-brand-subtext/40 mb-2 uppercase">DOMAIN</p>
                   <p className="font-bold text-xs uppercase text-white tracking-widest">{cat.label}</p>
                 </div>
               ))}
            </div>

            <div className="space-y-8">
               <div className="flex items-center gap-4 mb-10">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40 group-focus-within:text-brand-accent transition-colors" />
                    <input 
                      placeholder="Search controls by ID or Label..."
                      className="w-full bg-white/5 border border-white/10 px-16 py-4 rounded-2xl text-sm text-white focus:outline-none focus:border-brand-accent transition-all"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
               </div>

               <div className="space-y-6">
                  {selectedFramework.controls.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())).map(control => {
                    const status = controlStatuses[control.id] || 'Candidate';
                    return (
                      <div 
                        key={control.id} 
                        onClick={() => toggleStatus(control.id)}
                        className={`group p-8 rounded-[32px] border transition-all cursor-pointer ${
                          status === 'Approved' ? 'bg-green-500/5 border-green-500/20 shadow-lg shadow-green-500/5' : 
                          status === 'In Review' ? 'bg-orange-500/5 border-orange-500/20' : 
                          'bg-white/[0.01] border-white/5 hover:border-brand-accent/40'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <span className="data-mono font-bold bg-white/5 border border-white/10 text-brand-accent px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest">{control.id}</span>
                            <span className={`text-[8px] font-mono font-bold uppercase px-2 py-1 rounded-md border ${
                              status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                              status === 'In Review' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                              'bg-white/5 border-white/5 text-brand-subtext/40'
                            }`}>
                              {status}
                            </span>
                          </div>
                          <CheckCircle2 className={`w-5 h-5 transition-all drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] ${
                            status === 'Approved' ? 'text-green-500 opacity-100' : 'text-white/10 opacity-20 group-hover:opacity-100'
                          }`} />
                        </div>
                        <h5 className="text-xl font-bold mb-3 text-white group-hover:text-brand-accent transition-colors">{control.title}</h5>
                        <p className="text-sm text-brand-subtext/60 leading-relaxed italic">"{control.detail}"</p>
                        
                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-all">
                           <span className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">Type: Technical Control</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); setActiveModal('audit'); }}
                             className="text-[10px] font-bold uppercase tracking-widest text-brand-accent flex items-center gap-2 hover:underline"
                           >
                              Validated Audit Trails <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="space-y-10">
          <div className="bg-brand-accent p-12 rounded-[48px] text-white shadow-2xl shadow-brand-accent/20 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-accent shadow-xl">
                   <BookOpen className="w-6 h-6" />
                 </div>
                <h4 className="font-serif text-3xl italic">Mapping Guide</h4>
             </div>
             <p className="text-sm leading-relaxed text-white/70 mb-10 font-sans tracking-tight">
                Analysts should map findings from the <span className="text-white font-bold underline decoration-white/30">Risk Registry</span> to the controls above to generate verifiable SOC2 compliance evidence.
             </p>
             <button 
               onClick={() => setActiveModal('strategy')}
               className="w-full py-5 bg-white text-brand-accent rounded-[20px] font-bold text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
             >
                Open Strategy Document
             </button>
          </div>

          <div className="p-12 border border-brand-border rounded-[48px] bg-brand-panel shadow-2xl shadow-black/40">
             <h4 className="font-mono text-[10px] font-bold mb-10 uppercase tracking-[0.4em] text-brand-subtext/40">Compliance Roadmap</h4>
             <div className="space-y-8 relative">
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-white/5" />
                {[
                  { title: 'Asset Identification', status: 'done' },
                  { title: 'Risk Assessment', status: 'done' },
                  { title: 'Control Implementation', status: 'current' },
                  { title: 'Evidence Collection', status: 'todo' },
                  { title: 'Certification Audit', status: 'todo' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-8 relative z-10">
                    <div className={`w-[19px] h-[19px] rounded-full flex items-center justify-center border-2 ${
                      step.status === 'done' ? 'bg-brand-accent border-brand-accent shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 
                      step.status === 'current' ? 'bg-brand-panel border-brand-accent animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 
                      'bg-brand-panel border-white/10'
                    }`}>
                      {step.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm font-medium tracking-tight ${step.status === 'todo' ? 'text-brand-subtext/30' : 'text-white'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
