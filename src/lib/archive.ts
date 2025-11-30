// Erstelle einen vollständigen Snapshot (unabhängig von Zeit und Typ)
export const createDailySnapshot = async (
  tasks: Task[],
  taskDetails: Map<string, TaskDetail>,
  dailyTodos: string[]
): Promise<void> => {
  const userId = getCurrentUserId();
  const taskDetailsObj: { [key: string]: TaskDetail } = {};
  taskDetails.forEach((detail, taskId) => {
    taskDetailsObj[taskId] = detail;
  });
  const snapshot: Omit<ArchiveSnapshot, 'id'> = {
    userId,
    timestamp: new Date(),
    type: 'manual',
    tasks: tasks.map(task => cleanTaskForFirestore(task)),
    taskDetails: taskDetailsObj,
    dailyTodos,
  };
  try {
    const docRef = await addDoc(collection(db, ARCHIVE_COLLECTION), snapshot);
    console.log(`✅ MANUAL snapshot created successfully:`, docRef.id);
  } catch (error) {
    console.error('❌ Error creating manual snapshot:', error);
  }
};
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { ArchiveSnapshot, Task, TaskDetail } from '../types';

const ARCHIVE_COLLECTION = 'archives';

// Get current user ID
const getCurrentUserId = () => {
  const username = localStorage.getItem('mindmap-username');
  return username || 'Mateo';
};

// Clean task by removing undefined values (Firestore doesn't support undefined)
const cleanTaskForFirestore = (task: Task): any => {
  const cleaned: any = {
    ...task,
    createdAt: task.createdAt,
  };
  
  // Only add optional fields if they have values
  if (task.dueDate) cleaned.dueDate = task.dueDate;
  if (task.completedAt) cleaned.completedAt = task.completedAt;
  if (task.lastCompletedAt) cleaned.lastCompletedAt = task.lastCompletedAt;
  if (task.position) cleaned.position = task.position;
  if (task.recurrence) cleaned.recurrence = task.recurrence;
  if (task.collaborators && task.collaborators.length > 0) cleaned.collaborators = task.collaborators;
  
  // Remove undefined values
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
};

// Check if we should create a backup (morning: 6-10 AM, evening: 6-10 PM)
export const shouldCreateBackup = (): 'morning' | 'evening' | null => {
  const now = new Date();
  const hour = now.getHours();
  
  // Morning backup: 6-10 AM
  if (hour >= 6 && hour < 10) {
    return 'morning';
  }
  
  // Evening backup: 6-10 PM (18-22)
  if (hour >= 18 && hour < 22) {
    return 'evening';
  }
  
  return null;
};

// Check if backup already exists for today
export const hasBackupForToday = async (type: 'morning' | 'evening'): Promise<boolean> => {
  const userId = getCurrentUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const q = query(
    collection(db, ARCHIVE_COLLECTION),
    where('userId', '==', userId),
    where('type', '==', type),
    where('timestamp', '>=', Timestamp.fromDate(today)),
    where('timestamp', '<', Timestamp.fromDate(tomorrow)),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Create a backup snapshot
export const createBackup = async (
  tasks: Task[],
  taskDetails: Map<string, TaskDetail>,
  dailyTodos: string[]
): Promise<void> => {
  const backupType = shouldCreateBackup();
  
  if (!backupType) {
    console.log('⏰ Not in backup window (6-10 AM or 6-10 PM)');
    return;
  }
  
  // Check if backup already exists
  const exists = await hasBackupForToday(backupType);
  if (exists) {
    console.log(`📦 ${backupType} backup already exists for today`);
    return;
  }
  
  const userId = getCurrentUserId();
  
  // Convert Map to object for storage
  const taskDetailsObj: { [key: string]: TaskDetail } = {};
  taskDetails.forEach((detail, taskId) => {
    taskDetailsObj[taskId] = detail;
  });
  
  const snapshot: Omit<ArchiveSnapshot, 'id'> = {
    userId,
    timestamp: new Date(),
    type: backupType,
    tasks: tasks.map(task => cleanTaskForFirestore(task)),
    taskDetails: taskDetailsObj,
    dailyTodos,
  };
  
  try {
    const docRef = await addDoc(collection(db, ARCHIVE_COLLECTION), snapshot);
    console.log(`✅ ${backupType.toUpperCase()} backup created successfully:`, docRef.id);
    console.log(`📊 Backed up: ${tasks.length} tasks, ${Object.keys(taskDetailsObj).length} details, ${dailyTodos.length} daily todos`);
  } catch (error) {
    console.error('❌ Error creating backup:', error);
  }
};

// Get all backups for current user
export const getBackupHistory = async (): Promise<ArchiveSnapshot[]> => {
  const userId = getCurrentUserId();
  
  const q = query(
    collection(db, ARCHIVE_COLLECTION),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(30) // Last 30 backups (15 days)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
    tasks: doc.data().tasks.map((task: any) => ({
      ...task,
      createdAt: task.createdAt?.toDate?.() || task.createdAt,
      dueDate: task.dueDate?.toDate?.() || task.dueDate,
      completedAt: task.completedAt?.toDate?.() || task.completedAt,
    })),
  })) as ArchiveSnapshot[];
};

// Restore from a backup
export const restoreFromBackup = async (
  snapshotId: string
): Promise<{ tasks: Task[]; taskDetails: Map<string, TaskDetail>; dailyTodos: string[] } | null> => {
  try {
    const backups = await getBackupHistory();
    const backup = backups.find(b => b.id === snapshotId);
    
    if (!backup) {
      console.error('Backup not found:', snapshotId);
      return null;
    }
    
    const taskDetailsMap = new Map<string, TaskDetail>();
    Object.entries(backup.taskDetails).forEach(([taskId, detail]) => {
      taskDetailsMap.set(taskId, detail);
    });
    
    console.log(`🔄 Restored from backup: ${backup.type} - ${backup.timestamp.toLocaleString('de-DE')}`);
    console.log(`📊 Restored: ${backup.tasks.length} tasks, ${taskDetailsMap.size} details`);
    
    return {
      tasks: backup.tasks,
      taskDetails: taskDetailsMap,
      dailyTodos: backup.dailyTodos,
    };
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    return null;
  }
};

// Auto-backup trigger - call this on app load and periodically
export const triggerAutoBackup = async (
  tasks: Task[],
  taskDetails: Map<string, TaskDetail>,
  dailyTodos: string[]
): Promise<void> => {
  await createBackup(tasks, taskDetails, dailyTodos);
};
