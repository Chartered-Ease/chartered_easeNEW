import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseDb } from './firebase';

export interface CreateProjectInput {
  userId: string;
  entityId: string;
  entityName: string;
  entityType: string;
  service: string;
}

const pendingProjectKeys = new Set<string>();

export const createProject = async ({
  userId,
  entityId,
  entityName,
  entityType,
  service,
}: CreateProjectInput) => {
  if (!firebaseDb) {
    throw new Error('Firestore is not configured. Please check Firebase environment variables.');
  }

  const pendingKey = `${userId}::${entityId}::${service}`;

  if (pendingProjectKeys.has(pendingKey)) {
    throw new Error('Project creation is already in progress.');
  }

  pendingProjectKeys.add(pendingKey);

  try {
    const projectRef = await addDoc(collection(firebaseDb, 'projects'), {
      userId,
      entityId,
      entityName,
      entityType,
      service,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return projectRef.id;
  } finally {
    pendingProjectKeys.delete(pendingKey);
  }
};
