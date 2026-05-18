import { db, collection, addDoc, Timestamp } from './firebase';

export interface Evidence {
  id?: string;
  title: string;
  description: string;
  fileType: string;
  fileUrl?: string;
  controlId: string;
  status: 'pending' | 'verified' | 'rejected' | 'expiring';
  uploadedBy: string;
  createdAt: any;
  updatedAt: any;
}

export async function uploadEvidence(evidence: Omit<Evidence, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  try {
    const docRef = await addDoc(collection(db, 'evidence'), {
      ...evidence,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error uploading evidence:", error);
    throw error;
  }
}

export async function verifyEvidence(evidenceId: string) {
  // Logic to update status would go here
  console.log(`Verifying evidence ${evidenceId}`);
}
