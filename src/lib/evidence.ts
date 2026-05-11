import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Evidence } from '../types';
import { logSystemEvent } from './logger';

export async function createEvidence(
  type: Evidence['type'],
  title: string,
  description: string,
  metadata: any = {}
) {
  if (!auth.currentUser) return;

  // Simulate a cryptographic hash and signature
  const hash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  const signature = `SIG_TRUSTDESK_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

  const evidenceData: Evidence = {
    userId: auth.currentUser.uid,
    timestamp: new Date().toISOString(),
    type,
    title,
    description,
    hash,
    signature,
    verifier: 'TRUSTDESK_INTERNAL_VERIFIER_v4',
    metadata
  };

  try {
    const docRef = await addDoc(collection(db, 'evidence'), evidenceData);
    
    await logSystemEvent(
      `Evidence Created: ${title}`,
      'SYSTEM',
      'success',
      `New ${type} artifact committed to vault with hash ${hash.slice(0, 10)}...`,
      docRef.id
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'evidence');
  }
}
