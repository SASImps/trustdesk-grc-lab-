import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ControlAction } from '../types';

export async function logSystemEvent(
  action: string, 
  type: ControlAction['type'], 
  status: 'success' | 'failure' = 'success',
  details: string = '',
  controlId: string = 'na'
) {
  if (!auth.currentUser) return;

  const logData: ControlAction = {
    userId: auth.currentUser.uid,
    timestamp: new Date().toISOString(),
    action,
    type,
    status,
    details,
    controlId
  };

  try {
    await addDoc(collection(db, 'controlActions'), logData);
  } catch (error) {
    // We log but don't throw to avoid disrupting the main UI flow for logging failures
    console.error("Failed to log system event:", error);
    try {
      handleFirestoreError(error, OperationType.CREATE, 'controlActions');
    } catch {
      // Ignore nested errors
    }
  }
}
