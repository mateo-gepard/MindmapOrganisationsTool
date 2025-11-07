import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  setDoc,
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
    
    console.log('🔄 Firebase: Starting real-time task subscription...');
    
    return onSnapshot(q, 
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        
        // Log what changed
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          changes.forEach((change) => {
            if (change.type === 'added') {
              console.log('✅ New task synced from Firebase:', change.doc.id);
            }
            if (change.type === 'modified') {
              console.log('🔄 Task updated from Firebase:', change.doc.id);
            }
            if (change.type === 'removed') {
              console.log('🗑️ Task deleted from Firebase:', change.doc.id);
            }
          });
        }
        
        console.log(`📊 Firebase: Loaded ${tasks.length} tasks (${changes.length} changes)`);
        callback(tasks);
      },
      (error) => {
        console.error('❌ Firebase tasks subscription error:', error);
        // Provide empty array on error to prevent app crash
        callback([]);
      }
    );
  },

  // Add new task
  add: async (task: Omit<Task, 'id'>) => {
    const userId = getCurrentUserId();
    const taskWithUser = { ...task, userId };
    
    // Filter out undefined values to prevent Firebase errors
    const cleanTask = Object.fromEntries(
      Object.entries(taskWithUser).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Uploading new task to Firebase...');
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), cleanTask);
    console.log(`Task uploaded successfully: ${docRef.id}`);
    return docRef.id;
  },

  // Update task
  update: async (id: string, updates: Partial<Task>) => {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    // Filter out undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates as Record<string, any>).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      console.log(`Updating task ${id} in Firebase...`);
      await updateDoc(taskRef, cleanUpdates);
      console.log(`Task ${id} updated successfully`);
    }
  },

  // Delete task
  delete: async (id: string) => {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    console.log(`Deleting task ${id} from Firebase...`);
    await deleteDoc(taskRef);
    console.log(`Task ${id} deleted successfully`);
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
    try {
      await setDoc(docRef, { dailyTodos }, { merge: true });
      console.log(`Updated daily todos: ${dailyTodos.length} items`);
    } catch (error) {
      console.error('Error updating daily todos:', error);
    }
  },

  // Initialize user data document if it doesn't exist
  initialize: async () => {
    const userId = getCurrentUserId();
    const docRef = doc(db, USER_DATA_COLLECTION, userId);
    
    try {
      // Use setDoc with merge to create or update the document
      await setDoc(docRef, { 
        lastAccess: new Date(),
        dailyTodos: []
      }, { merge: true });
      console.log('User data initialized successfully');
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  },
};