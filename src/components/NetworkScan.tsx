import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ServiceInventory } from '../types';
import { Globe, Server, Database, ShieldAlert, CheckCircle2, Search, Cpu, Activity, Zap, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { assessAISafety } from '../services/gemini';
import { logSystemEvent } from '../lib/logger';
import { createEvidence } from '../lib/evidence';

export default function NetworkScan() {
  const [services, setServices] = useState<ServiceInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (s) => {
      setServices(s.docs.map(d => ({ id: d.id, ...d.data() } as ServiceInventory)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory'));

    return unsub;
  }, []);

  const bootstrapInventory = async () => {
    if (!auth.currentUser) return;
    const initialServices: Partial<ServiceInventory>[] = [
      { name: 'User Authentication API', type: 'API', provider: 'AWS', status: 'Healthy', lastScanned: new Date().toISOString(), vulnerabilities: [] },
      { name: 'Core Transaction DB', type: 'Database', provider: 'GCP', status: 'Healthy', lastScanned: new Date().toISOString(), vulnerabilities: [] },
      { name: 'Public Asset Bucket', type: 'Cloud Storage', provider: 'Azure', status: 'Vulnerable', lastScanned: new Date().toISOString(), vulnerabilities: ['Public Read Access Enabled'] },
      { name: 'Analytics Worker', type: 'Compute', provider: 'GCP', status: 'Healthy', lastScanned: new Date().toISOString(), vulnerabilities: [] },
    ];

    for (const s of initialServices) {
      try {
        await addDoc(collection(db, 'inventory'), { ...s, userId: auth.currentUser.uid });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'inventory');
      }
    }
  };

  const runScan = async (service: ServiceInventory) => {
    setScanning(service.id!);
    try {
      // Simulate AI scanning infrastructure metadata
      const scanResult = await assessAISafety(`Inventory Name: ${service.name}. Type: ${service.type}. Provider: ${service.provider}.`);
      
      const newStatus = scanResult.riskRating === 'High' ? 'Vulnerable' : scanResult.riskRating === 'Medium' ? 'Degraded' : 'Healthy';
      const vulns = scanResult.piiFound ? ['PII data exposure detected in logs'] : [];

      await updateDoc(doc(db, 'inventory', service.id!), {
        status: newStatus,
        vulnerabilities: vulns,
        lastScanned: new Date().toISOString()
      });

      await logSystemEvent(
        `Infra Scan: ${service.name}`,
        'AI_AUDIT',
        newStatus === 'Vulnerable' ? 'failure' : 'success',
        `Deep scan completed. Status: ${newStatus}. Risk: ${scanResult.riskRating}`,
        service.id
      );

      if (newStatus === 'Vulnerable') {
        await createEvidence(
          'AUDIT',
          `Vulnerability Report: ${service.name}`,
          `AI scan detected high-risk configuration gap in ${service.name}. Scan ID: ${scanResult.assessmentId}`,
          { scanResult, service }
        );
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${service.id}`);
    } finally {
      setScanning(null);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="font-serif text-6xl text-white mb-6">Service <span className="italic">Inventory.</span></h1>
          <p className="text-xl text-brand-subtext leading-relaxed">
            Automated discovery and vulnerability assessment of your enterprise cloud topography.
            TrustDesk AI maps services and identifies shadow infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-4">
           {services.length === 0 && !loading && (
             <button 
               onClick={bootstrapInventory}
               className="px-8 py-4 bg-brand-accent text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-brand-accent/20"
             >
               Bootstrap Topography
             </button>
           )}
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-subtext/40 group-focus-within:text-brand-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Filter nodes..."
                className="w-64 bg-brand-panel border border-brand-border rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:outline-none focus:border-brand-accent transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Map View (Simplified Canvas representation) */}
        <div className="lg:col-span-3 bg-brand-panel rounded-[48px] border border-brand-border h-[600px] relative overflow-hidden shadow-2xl bg-grid-pattern">
           {/* Animated Radar Effect */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 border border-brand-accent/10 rounded-full animate-ping" />
              <div className="w-[600px] h-[600px] border border-brand-accent/5 rounded-full animate-pulse" />
           </div>

           {/* Nodes Display */}
           <div className="absolute inset-0 p-12">
              <AnimatePresence>
                {filteredServices.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: (idx % 3) * 300,
                      y: Math.floor(idx / 3) * 200
                    }}
                    className={`absolute w-64 p-6 rounded-3xl border backdrop-blur-xl transition-all cursor-pointer group select-none ${
                       service.status === 'Vulnerable' ? 'bg-red-500/10 border-red-500/20' :
                       service.status === 'Degraded' ? 'bg-orange-500/10 border-orange-500/20' :
                       'bg-white/5 border-white/10'
                    }`}
                    onClick={() => runScan(service)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                          service.status === 'Vulnerable' ? 'bg-red-500 text-white' :
                          service.status === 'Degraded' ? 'bg-orange-500 text-white' :
                          'bg-brand-accent text-white'
                       }`}>
                          {service.type === 'Database' ? <Database className="w-5 h-5" /> : 
                           service.type === 'API' ? <Globe className="w-5 h-5" /> : 
                           <Server className="w-5 h-5" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-mono text-brand-subtext/40 uppercase tracking-widest truncate">{service.type}</p>
                          <h4 className="text-xs font-bold text-white truncate">{service.name}</h4>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="text-brand-subtext/60">PROVIDER:</span>
                          <span className="text-brand-accent">{service.provider}</span>
                       </div>
                       <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="text-brand-subtext/60">HEALTH:</span>
                          <span className={service.status === 'Healthy' ? 'text-green-500' : 'text-red-500'}>
                             {service.status.toUpperCase()}
                          </span>
                       </div>
                    </div>

                    {scanning === service.id ? (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                         <div className="w-3 h-3 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                         <span className="text-[8px] font-mono text-brand-accent uppercase tracking-widest animate-pulse">Scanning_Node...</span>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[8px] font-mono text-brand-subtext/20">L_SCAN: {new Date(service.lastScanned).toLocaleTimeString()}</span>
                         <RefreshCw className="w-3 h-3 text-brand-subtext/40 group-hover:rotate-180 transition-transform duration-500" />
                      </div>
                    )}

                    {service.vulnerabilities.length > 0 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                         <ShieldAlert className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           {/* Stats Overlay */}
           <div className="absolute bottom-12 left-12 right-12 flex gap-8">
              <div className="p-6 bg-black/40 border border-white/5 backdrop-blur-xl rounded-3xl flex-1 flex items-center gap-6">
                 <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">Healthy Nodes</p>
                    <p className="text-2xl font-serif text-white">{services.filter(s => s.status === 'Healthy').length}</p>
                 </div>
              </div>
              <div className="p-6 bg-black/40 border border-white/5 backdrop-blur-xl rounded-3xl flex-1 flex items-center gap-6">
                 <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">Vulnerabilities</p>
                    <p className="text-2xl font-serif text-white">{services.filter(s => s.status === 'Vulnerable').length}</p>
                 </div>
              </div>
              <div className="p-6 bg-black/40 border border-white/5 backdrop-blur-xl rounded-3xl flex-1 flex items-center gap-6">
                 <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                    <Layers className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-mono text-brand-subtext/40 uppercase tracking-widest">Total Services</p>
                    <p className="text-2xl font-serif text-white">{services.length}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-brand-panel rounded-[40px] border border-brand-border p-8 shadow-2xl relative overflow-hidden">
              <h3 className="font-serif text-2xl text-white mb-6">Discovery Log</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {services.flatMap(s => s.vulnerabilities.map((v, i) => ({ service: s, vuln: v, id: `${s.id}-${i}` }))).map((item) => (
                    <div key={item.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest">Finding_Critical</span>
                          <span className="text-[8px] font-mono text-white/20">{new Date(item.service.lastScanned).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-xs font-bold text-white">{item.vuln}</p>
                       <p className="text-[10px] text-brand-subtext/60">Node: {item.service.name}</p>
                    </div>
                 ))}
                 {services.every(s => s.vulnerabilities.length === 0) && (
                   <div className="py-20 text-center opacity-20">
                      <Zap className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-xs font-mono uppercase tracking-[0.2em]">No Active Threats</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-brand-accent p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-accent">
                    <Activity className="w-6 h-6" />
                 </div>
                 <h4 className="font-serif text-xl italic">Live_Monitor</h4>
              </div>
              <p className="text-xs leading-relaxed text-white/80 relative z-10">
                Click any infrastructure node to trigger a real-time AI configuration audit. Trusted by default, verified by exception.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
