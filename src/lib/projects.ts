import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from './firebase';

export interface CreateProjectInput {
  entityId: string;
  entityName: string;
  entityType: string;
  service: string;
}

const pendingProjectKeys = new Set<string>();

export const createProject = async ({
  entityId,
  entityName,
  entityType,
  service,
}: CreateProjectInput) => {
  if (!firebaseDb) {
    throw new Error('Firestore is not configured. Please check Firebase environment variables.');
  }

  const currentUser = firebaseAuth?.currentUser;

  if (!currentUser) {
    throw new Error('Please login before creating a project.');
  }

  const pendingKey = `${currentUser.uid}::${entityId}::${service}`;

  if (pendingProjectKeys.has(pendingKey)) {
    throw new Error('Project creation is already in progress.');
  }

  pendingProjectKeys.add(pendingKey);

  try {
    const projectRef = await addDoc(collection(firebaseDb, 'projects'), {
      userId: currentUser.uid,
      entityId,
      entityName,
      entityType,
      service,
      status: 'pending',
      assignedTo: 'unassigned',
      createdAt: serverTimestamp(),
    });

    if (typeof window !== 'undefined') {
      window.alert('Project created successfully.');
    }

    return projectRef.id;
  } finally {
    pendingProjectKeys.delete(pendingKey);
  }
};
