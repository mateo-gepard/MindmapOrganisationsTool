import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskDetail } from '../types';

// Collections
const TASKS_COLLECTION = 'tasks';
const TASK_DETAILS_COLLECTION = 'taskDetails';
const USER_DATA_COLLECTION = 'userData';

// User ID - in real app this would come from authentication
const getCurrentUserId = () => {
  // For now, use a fixed user ID or localStorage fallback
  let userId = localStorage.getItem('mindmap-user-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mindmap-user-id', userId);
  }
  return userId;
};

// Task operations
export const firestoreTasks = {
  // Subscribe to tasks changes
  subscribe: (callback: (tasks: Task[]) => void) => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks);
    });
  },

  // Add new task
  add: async (task: Omit<Task, 'id'>) => {
    const userId = getCurrentUserId();
    const taskWithUser = { ...task, userId };
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskWithUser);
    return docRef.id;
  },

  // Update task
  update: async (id: string, updates: Partial<Task>) => {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(taskRef, updates);
  },

  // Delete task
  delete: async (id: string) => {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(taskRef);
  },
};

// Task details operations
export const firestoreTaskDetails = {
  subscribe: (callback: (details: { [key: string]: TaskDetail }) => void) => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, TASK_DETAILS_COLLECTION),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const details: { [key: string]: TaskDetail } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as TaskDetail & { userId: string };
        const { userId, ...taskDetail } = data;
        details[taskDetail.taskId] = taskDetail;
      });
      callback(details);
    });
  },

  add: async (detail: TaskDetail) => {
    const userId = getCurrentUserId();
    const detailWithUser = { ...detail, userId };
    await addDoc(collection(db, TASK_DETAILS_COLLECTION), detailWithUser);
  },

  update: async (taskId: string, updates: Partial<TaskDetail>) => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, TASK_DETAILS_COLLECTION),
      where('taskId', '==', taskId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = doc(db, TASK_DETAILS_COLLECTION, snapshot.docs[0].id);
      await updateDoc(docRef, updates);
    }
  },
};

// User data (daily todos, filters, etc.)
export const firestoreUserData = {
  subscribe: (callback: (data: { dailyTodos: string[] }) => void) => {
    const userId = getCurrentUserId();
    const docRef = doc(db, USER_DATA_COLLECTION, userId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as { dailyTodos: string[] });
      } else {
        callback({ dailyTodos: [] });
      }
    });
  },

  updateDailyTodos: async (dailyTodos: string[]) => {
    const userId = getCurrentUserId();
    const docRef = doc(db, USER_DATA_COLLECTION, userId);
    await updateDoc(docRef, { dailyTodos });
  },

  // Initialize user data document if it doesn't exist
  initialize: async () => {
    const userId = getCurrentUserId();
    const docRef = doc(db, USER_DATA_COLLECTION, userId);
    
    try {
      await updateDoc(docRef, { lastAccess: new Date() });
    } catch (error) {
      // Document doesn't exist, create it
      await addDoc(collection(db, USER_DATA_COLLECTION), {
        userId,
        dailyTodos: [],
        createdAt: new Date(),
      });
    }
  },
};