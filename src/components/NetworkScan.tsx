import React, { useState, useEffect } from 'react';
import { Activity, Database, Globe, Server, ShieldCheck } from 'lucide-react';
import { db, collection, query, onSnapshot, orderBy, handleFirestoreError, OperationType } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: string;
}

export function NetworkScan() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Activity size={32} className="animate-spin text-emerald-500 mr-3" />
      <span>Scanning Assets...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Network & Asset Scan</h1>
          <p className="text-sm text-slate-500">Automated discovery of organizational infrastructure.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
             <Globe size={18} />
             Start Deep Scan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Database size={64} />
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-slate-800 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-inner">
                {item.type.toLowerCase().includes('server') ? <Server size={24} /> : <Database size={24} />}
              </div>
              <span className="bg-slate-800 text-slate-400 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg">
                {item.type}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-1">{item.name}</h3>
            <p className="text-xs text-slate-500 mb-6 font-mono">Owner: {item.owner || 'System'}</p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Encrypted</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                item.status === 'Active' ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-slate-500 border-slate-800 bg-slate-900"
              )}>
                {item.status || 'Discovered'}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
             <Globe className="mx-auto mb-4 text-slate-700 animate-pulse" size={48} />
             <p className="text-slate-500 font-medium">No assets discovered in this subnet.</p>
             <p className="text-xs text-slate-600 mt-1">Initiate a scan to populate the inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
