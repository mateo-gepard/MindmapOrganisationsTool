import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CompletedTaskArchive, Task } from '../types';

const COMPLETED_TASKS_COLLECTION = 'completedTasks';

// Get current user ID
const getCurrentUserId = () => {
  const username = localStorage.getItem('mindmap-username');
  return username || 'Mateo';
};

// Archive a completed task
export const archiveCompletedTask = async (task: Task): Promise<void> => {
  if (!task.completedAt) {
    console.warn('Cannot archive task without completedAt date');
    return;
  }

  const userId = getCurrentUserId();
  
  const archivedTask: Omit<CompletedTaskArchive, 'id'> = {
    userId,
    taskId: task.id,
    title: task.title,
    type: task.type,
    priority: task.priority,
    areas: task.areas,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    wasRepetitive: task.type === 'repetitive',
    recurrence: task.recurrence,
  };

  try {
    const docRef = await addDoc(collection(db, COMPLETED_TASKS_COLLECTION), archivedTask);
    console.log(`✅ Task archived: "${task.title}" (${docRef.id})`);
  } catch (error) {
    console.error('❌ Error archiving task:', error);
  }
};

// Get completed tasks history
export const getCompletedTasksHistory = async (limit: number = 50): Promise<CompletedTaskArchive[]> => {
  const userId = getCurrentUserId();
  
  const q = query(
    collection(db, COMPLETED_TASKS_COLLECTION),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    firestoreLimit(limit)
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
    })) as CompletedTaskArchive[];
  } catch (error) {
    console.error('❌ Error loading completed tasks:', error);
    return [];
  }
};

// Get statistics
export const getCompletionStats = async (): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}> => {
  const userId = getCurrentUserId();
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Get all completed tasks
    const q = query(
      collection(db, COMPLETED_TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({
      completedAt: doc.data().completedAt?.toDate?.() || new Date(doc.data().completedAt),
    }));

    return {
      today: tasks.filter(t => t.completedAt >= startOfToday).length,
      thisWeek: tasks.filter(t => t.completedAt >= startOfWeek).length,
      thisMonth: tasks.filter(t => t.completedAt >= startOfMonth).length,
      total: tasks.length,
    };
  } catch (error) {
    console.error('❌ Error getting completion stats:', error);
    return { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
  }
};
