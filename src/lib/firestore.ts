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
  orderBy,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskDetail } from '../types';

// Collections
const TASKS_COLLECTION = 'tasks';
const TASK_DETAILS_COLLECTION = 'taskDetails';
const USER_DATA_COLLECTION = 'userData';

// User ID - get from localStorage (username-based)
const getCurrentUserId = () => {
  const username = localStorage.getItem('mindmap-username');
  if (!username) {
    // Should never happen as we require login, but fallback to 'Mateo'
    return 'Mateo';
  }
  return username;
};

// Task operations
export const firestoreTasks = {
  // Subscribe to tasks changes
  subscribe: (callback: (tasks: Task[]) => void) => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, TASKS_COLLECTION),
      // Firestore does not support OR queries directly, so we fetch all tasks and filter client-side
      orderBy('createdAt', 'desc')
    );
    console.log('🔄 Firebase: Starting real-time task subscription...');
    return onSnapshot(q, 
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firebase Timestamps to JavaScript Dates
          const task: Task = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            dueDate: data.dueDate?.toDate?.() || data.dueDate,
            completedAt: data.completedAt?.toDate?.() || data.completedAt,
          } as Task;
          return task;
        })
        // Filter tasks: show if user is owner or collaborator
        .filter(task =>
          task.userId === userId || (Array.isArray(task.collaborators) && task.collaborators.includes(userId))
        );
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
    
    // Convert undefined values to deleteField() to properly remove fields from Firestore
    const cleanUpdates: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        // Use deleteField() to explicitly remove the field from Firestore
        cleanUpdates[key] = deleteField();
      } else {
        cleanUpdates[key] = value;
      }
    }

    if (Object.keys(cleanUpdates).length > 0) {
      console.log(`Updating task ${id} in Firebase...`, cleanUpdates);
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
    // Fetch all task details - we'll filter on the client side based on accessible tasks
    const q = query(
      collection(db, TASK_DETAILS_COLLECTION)
    );
    
    console.log(`🔄 Starting taskDetails subscription for user: ${userId}`);
    
    return onSnapshot(q, (snapshot) => {
      const details: { [key: string]: TaskDetail } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as TaskDetail & { userId: string };
        const { userId: detailUserId, ...taskDetail } = data;
        // Convert milestone.targetDate to Date if needed
        if (Array.isArray(taskDetail.milestones)) {
          taskDetail.milestones = taskDetail.milestones.map(milestone => {
            let dateValue = milestone.targetDate;
            // Firestore Timestamp objects have a toDate method, native Date objects do not
            if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
              dateValue = dateValue.toDate();
            }
            return {
              ...milestone,
              targetDate: dateValue
            };
          });
        }
        // Include task detail if user owns it OR if it's for a collaborative task
        // Note: The task filtering happens in firestoreTasks.subscribe, so we include all details here
        // and let the UI filter based on accessible tasks
        details[taskDetail.taskId] = taskDetail;
      });
      console.log(`✅ Loaded ${Object.keys(details).length} task details`);
      callback(details);
    });
  },

  add: async (detail: TaskDetail) => {
    const userId = getCurrentUserId();
    const detailWithUser = { ...detail, userId };
    await addDoc(collection(db, TASK_DETAILS_COLLECTION), detailWithUser);
  },

  update: async (taskId: string, updates: Partial<TaskDetail>) => {
    // Query by taskId only - allow collaborators to update task details
    const q = query(
      collection(db, TASK_DETAILS_COLLECTION),
      where('taskId', '==', taskId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = doc(db, TASK_DETAILS_COLLECTION, snapshot.docs[0].id);
      await updateDoc(docRef, updates);
      console.log(`✅ Task detail updated for taskId: ${taskId}`);
    } else {
      console.warn(`⚠️ No task detail found for taskId: ${taskId}`);
    }
  },
};

// User data (daily todos, filters, etc.)
export const firestoreUserData = {
  subscribe: (callback: (data: { dailyTodos: string[] }) => void) => {
    const userId = getCurrentUserId();
    const docRef = doc(db, USER_DATA_COLLECTION, userId);
    
    console.log(`🔄 Starting userData subscription for user: ${userId}`);
    
    return onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as { dailyTodos: string[] };
          console.log(`✅ UserData snapshot received: ${data.dailyTodos?.length || 0} daily todos`);
          callback(data);
        } else {
          console.log('⚠️ UserData document does not exist, returning empty array');
          callback({ dailyTodos: [] });
        }
      },
      (error) => {
        console.error('❌ UserData subscription error:', error);
        callback({ dailyTodos: [] });
      }
    );
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
      // Only update lastAccess, don't touch dailyTodos
      // This prevents overwriting existing daily todos on app reload
      await setDoc(docRef, { 
        lastAccess: new Date(),
      }, { merge: true });
      console.log('User data initialized successfully (dailyTodos preserved)');
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  },
};