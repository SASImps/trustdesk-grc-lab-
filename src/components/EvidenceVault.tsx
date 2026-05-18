import React, { useState, useEffect } from 'react';
import { FileCheck, Activity, Plus } from 'lucide-react';
import { db, collection, query, onSnapshot, orderBy, handleFirestoreError, OperationType, addDoc, Timestamp, auth } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Evidence {
  id: string;
  title: string;
  fileType: string;
  createdAt: any;
  status: 'pending' | 'verified' | 'rejected' | 'expiring';
}

export function EvidenceVault() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'evidence'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evidenceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evidence[];
      setEvidence(evidenceData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evidence');
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Activity size={32} className="animate-spin text-emerald-500 mr-3" />
      <span>Decrypting Evidence Vault...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evidence Vault</h1>
        <div className="flex gap-2">
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            Download Audit Pack
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <Plus size={18} />
            Upload Evidence
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evidence.map((file) => (
          <div key={file.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                <FileCheck size={20} />
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-1 rounded">{file.fileType}</span>
            </div>
            <h4 className="font-bold text-slate-200 mb-1">{file.title}</h4>
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-slate-500 font-mono italic">
                {file.createdAt?.toDate ? file.createdAt.toDate().toLocaleDateString() : 'Date Unknown'}
              </p>
              <p className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                file.status === 'verified' && "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10",
                file.status === 'pending' && "text-amber-400 bg-amber-500/5 border border-amber-500/10",
                file.status === 'expiring' && "text-rose-400 bg-rose-500/5 border border-rose-500/10"
              )}>
                {file.status}
              </p>
            </div>
          </div>
        ))}
        {evidence.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
             <FileCheck className="mx-auto mb-4 text-slate-700" size={48} />
             <p className="text-slate-500">No evidence collected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
