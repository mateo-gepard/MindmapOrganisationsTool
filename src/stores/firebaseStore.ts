import { create } from 'zustand';
import type {
  Task,
  TaskDetail,
  Recurrence,
  TimeBlock,
  FilterConfig,
  ViewType,
  Area,
} from '../types';
import { firestoreTasks, firestoreTaskDetails, firestoreUserData } from '../lib/firestore';
import { triggerAutoBackup } from '../lib/archive';
import { archiveCompletedTask } from '../lib/completedTasksArchive';

interface AppState {
  // User management
  currentUser: string | null;
  setCurrentUser: (username: string) => void;

  // View management
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Daily planning mode
  isDailyPlanningMode: boolean;
  setDailyPlanningMode: (enabled: boolean) => void;
  dailyTodos: string[]; // Task IDs for today's focus
  addToDailyTodos: (taskId: string) => void;
  removeFromDailyTodos: (taskId: string) => void;
  clearDailyTodos: () => void;
  midnightCleanup: () => Promise<void>;
  eveningCleanup: () => Promise<void>;

  // Tasks
  tasks: Task[];
  taskDetails: Map<string, TaskDetail>;
  recurrences: Map<string, Recurrence>;
  timeBlocks: TimeBlock[];

  // Areas configuration
  areas: Area[];

  // Filters
  filters: FilterConfig;
  setFilters: (filters: Partial<FilterConfig>) => void;

  // Task operations (Firebase-enabled)
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string, fromDailyView?: boolean) => Promise<void>;

  // Large task operations
  updateTaskDetail: (taskId: string, detail: Partial<TaskDetail>) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => Promise<void>;
  addMilestone: (taskId: string, title: string, targetDate: Date) => Promise<void>;
  deleteMilestone: (taskId: string, milestoneId: string) => Promise<void>;
  updateMilestone: (taskId: string, milestoneId: string, title: string, targetDate: Date) => Promise<void>;

  // Recurrence operations
  setRecurrence: (taskId: string, recurrence: Omit<Recurrence, 'taskId'>) => void;
  completeRecurrenceInstance: (taskId: string, date: Date) => void;

  // Time block operations
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;

  // Firebase initialization
  initializeFirebase: () => void;
}

// Default areas configuration
const defaultAreas: Area[] = [
  { id: 'school', name: 'Schule', color: '#003049', position: { x: 280, y: 220 }, radius: 160 },
  { id: 'sport', name: 'Sport', color: '#669bbc', position: { x: 520, y: 220 }, radius: 160 },
  { id: 'business', name: 'Geschäft', color: '#c1121f', position: { x: 280, y: 460 }, radius: 160 },
  { id: 'projects', name: 'Projekte', color: '#780000', position: { x: 520, y: 460 }, radius: 160 },
  { id: 'leisure', name: 'Freizeitaktivitäten', color: '#669bbc', position: { x: 400, y: 340 }, radius: 400 },
];

const defaultFilters: FilterConfig = {
  areas: [],
  types: [],
  priorities: [],
  timeRange: 'all',
  focusMode: false,
};

// Guard to prevent multiple initializations WITHIN the same session
// Reset on module reload (page refresh)
let isFirebaseInitialized = false;

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  currentView: 'map',
  tasks: [],
  taskDetails: new Map(),
  recurrences: new Map(),
  timeBlocks: [],
  areas: defaultAreas,
  filters: defaultFilters,
  isDailyPlanningMode: false,
  dailyTodos: [],

  // User management
  setCurrentUser: (username) => {
    console.log(`👤 setCurrentUser called with: ${username}`);
    set({ currentUser: username });
    localStorage.setItem('mindmap-username', username);
    // Reset initialization guard for new user
    console.log('🔄 New user set, resetting Firebase initialization guard');
    isFirebaseInitialized = false;
    // Reinitialize Firebase with new user
    console.log('🚀 About to call initializeFirebase from setCurrentUser...');
    get().initializeFirebase();
  },

  // View management
  setCurrentView: (view) => set({ currentView: view }),

  // Daily planning mode
  setDailyPlanningMode: (enabled) => set({ isDailyPlanningMode: enabled }),
  
  addToDailyTodos: async (taskId) => {
    const state = get();
    if (!state.dailyTodos.includes(taskId)) {
      const newDailyTodos = [...state.dailyTodos, taskId];
      console.log(`📝 Adding task to daily todos: ${taskId}. Total: ${newDailyTodos.length}`);
      set({ dailyTodos: newDailyTodos });
      await firestoreUserData.updateDailyTodos(newDailyTodos);
      console.log(`✅ Daily todos saved to Firebase: ${newDailyTodos.length} items`);
    }
  },
  
  removeFromDailyTodos: async (taskId) => {
    const state = get();
    const newDailyTodos = state.dailyTodos.filter((id) => id !== taskId);
    console.log(`🗑️ Removing task from daily todos: ${taskId}. Remaining: ${newDailyTodos.length}`);
    set({ dailyTodos: newDailyTodos });
    await firestoreUserData.updateDailyTodos(newDailyTodos);
    console.log(`✅ Daily todos updated in Firebase`);
  },
  
  clearDailyTodos: async () => {
    set({ dailyTodos: [] });
    await firestoreUserData.updateDailyTodos([]);
  },

  // Clean up completed tasks from daily todos (called on app start)
  // Midnight cleanup - wipe all daily todos at midnight (00:00)
  midnightCleanup: async () => {
    const state = get();
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only run between 00:00 and 00:59
    if (currentHour !== 0) {
      return;
    }
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Check if we've already cleaned today
    const lastCleanup = localStorage.getItem('dailyTodos-lastCleanup');
    const lastCleanupDate = lastCleanup ? new Date(lastCleanup) : null;
    
    if (lastCleanupDate) {
      lastCleanupDate.setHours(0, 0, 0, 0);
      if (lastCleanupDate.getTime() === today.getTime()) {
        // Already cleaned today
        return;
      }
    }
    
    // It's midnight of a new day - wipe the daily todos
    console.log(`🌙 Midnight wipe: Clearing all ${state.dailyTodos.length} tasks from daily plan (new day)`);
    set({ dailyTodos: [] });
    await firestoreUserData.updateDailyTodos([]);
    
    // Mark today as cleaned
    localStorage.setItem('dailyTodos-lastCleanup', today.toISOString());
  },

  // Evening cleanup - remove completed tasks (called by interval)
  eveningCleanup: async () => {
    const state = get();
    const now = new Date();
    const hour = now.getHours();
    
    // Only run between 8 PM (20:00) and 11:59 PM (23:59)
    if (hour < 20) {
      return;
    }
    
    // Check if we've already done evening cleanup today
    const lastEveningCleanup = localStorage.getItem('dailyTodos-lastEveningCleanup');
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (lastEveningCleanup) {
      const lastCleanupDate = new Date(lastEveningCleanup);
      lastCleanupDate.setHours(0, 0, 0, 0);
      if (lastCleanupDate.getTime() === today.getTime()) {
        // Already cleaned this evening
        return;
      }
    }
    
    // Remove completed tasks from daily plan
    const remainingTasks: string[] = [];
    
    for (const taskId of state.dailyTodos) {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) continue;
      
      // Keep unfinished tasks
      if (!task.completedAt) {
        remainingTasks.push(taskId);
      }
      // For large projects: keep if there are unfinished subtasks
      else if (task.type === 'large') {
        const details = state.taskDetails.get(taskId);
        const hasUnfinishedSubtasks = details?.subtasks.some(st => !st.done);
        if (hasUnfinishedSubtasks) {
          remainingTasks.push(taskId);
        }
      }
      // For repetitive tasks: always keep them
      else if (task.type === 'repetitive') {
        remainingTasks.push(taskId);
      }
      // One-time tasks that are completed: remove them
    }
    
    if (remainingTasks.length !== state.dailyTodos.length) {
      console.log(`🌙 Evening cleanup: Removed ${state.dailyTodos.length - remainingTasks.length} completed tasks from daily plan`);
      set({ dailyTodos: remainingTasks });
      await firestoreUserData.updateDailyTodos(remainingTasks);
      
      // Mark evening cleanup as done for today
      localStorage.setItem('dailyTodos-lastEveningCleanup', now.toISOString());
    }
  },

  // Filter management
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  // Firebase-enabled task operations
  addTask: async (taskData) => {
    const newTask: any = {
      title: taskData.title,
      type: taskData.type,
      priority: taskData.priority,
      areas: taskData.areas,
      position: taskData.position,
      isHybrid: taskData.areas.length > 1,
      createdAt: new Date(),
    };

    // Only add optional fields if they have values
    if (taskData.dueDate) {
      newTask.dueDate = taskData.dueDate;
    }
    if (taskData.completedAt) {
      newTask.completedAt = taskData.completedAt;
    }

    try {
      const taskId = await firestoreTasks.add(newTask);
      
      // Initialize task detail for large tasks
      if (newTask.type === 'large') {
        const detail: TaskDetail = {
          taskId,
          goal: '',
          progress: 0,
          subtasks: [],
          milestones: [],
        };
        await firestoreTaskDetails.add(detail);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  },

  updateTask: async (id, updates) => {
    try {
      await firestoreTasks.update(id, {
        ...updates,
        isHybrid: (updates.areas || get().tasks.find(t => t.id === id)?.areas || []).length > 1,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await firestoreTasks.delete(id);
      // Remove from daily todos if present
      const state = get();
      if (state.dailyTodos.includes(id)) {
        const newDailyTodos = state.dailyTodos.filter(todoId => todoId !== id);
        set({ dailyTodos: newDailyTodos });
        await firestoreUserData.updateDailyTodos(newDailyTodos);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },

  toggleTaskComplete: async (id, fromDailyView = false) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    if (task.completedAt) {
      // Uncomplete task - now works because we use deleteField() in firestore.ts
      console.log(`⬅️ Uncompleting task: "${task.title}"`);
      await get().updateTask(id, { 
        completedAt: undefined,
        lastCompletedAt: undefined 
      });
      return;
    }

    // Complete task
    const now = new Date();
    
    // For daily view: only mark as complete, don't archive or delete
    if (fromDailyView) {
      await get().updateTask(id, { completedAt: now });
      console.log(`✅ Daily task marked complete: "${task.title}"`);
      return;
    }
    
    // For other views: apply normal logic
    if (task.type === 'repetitive' && task.recurrence) {
      // For repetitive tasks: archive completion, reset, and update lastCompletedAt
      const completedTask = { ...task, completedAt: now };
      await archiveCompletedTask(completedTask);
      
      // Reset task for next occurrence
      await get().updateTask(id, { 
        completedAt: undefined,
        lastCompletedAt: now
      });
      
      console.log(`🔄 Repetitive task completed and reset: "${task.title}"`);
    } else {
      // For one-time and large tasks: mark complete and archive
      await get().updateTask(id, { completedAt: now });
      
      // Archive and then delete after a short delay
      setTimeout(async () => {
        const updatedTask = get().tasks.find(t => t.id === id);
        if (updatedTask?.completedAt) {
          await archiveCompletedTask(updatedTask);
          await get().deleteTask(id);
          console.log(`✅ Task completed, archived, and removed: "${task.title}"`);
        }
      }, 2000); // 2 second delay to show completion animation
    }
  },

  // Large task operations (Firebase-enabled)
  updateTaskDetail: async (taskId, detail) => {
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
      if (existing) {
        newTaskDetails.set(taskId, { ...existing, ...detail });
      }
      return { taskDetails: newTaskDetails };
    });
    // Update in Firebase
    await firestoreTaskDetails.update(taskId, detail);
  },

  addSubtask: async (taskId: string, title: string) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const maxOrder = Math.max(
        ...existing.subtasks.map(st => st.order),
        ...existing.milestones.map(m => m.order),
        -1
      );
      const newSubtask = {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        done: false,
        createdAt: new Date(),
        order: maxOrder + 1,
      };
      const updatedSubtasks = [...existing.subtasks, newSubtask];
      
      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: updatedSubtasks,
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { subtasks: updatedSubtasks });
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const updatedSubtasks = existing.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, done: !st.done } : st
      );
      const completedCount = updatedSubtasks.filter((st) => st.done).length;
      const progress = updatedSubtasks.length > 0 ? (completedCount / updatedSubtasks.length) * 100 : 0;

      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: updatedSubtasks,
          progress: Math.round(progress),
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { 
        subtasks: updatedSubtasks,
        progress: Math.round(progress)
      });
    }
  },

  addMilestone: async (taskId: string, title: string, targetDate: Date) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const maxOrder = Math.max(
        ...existing.subtasks.map(st => st.order),
        ...existing.milestones.map(m => m.order),
        -1
      );
      const newMilestone = {
        id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        targetDate,
        completed: false,
        order: maxOrder + 1,
      };
      const updatedMilestones = [...existing.milestones, newMilestone];
      
      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          milestones: updatedMilestones,
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { milestones: updatedMilestones });
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const updatedSubtasks = existing.subtasks.filter((st) => st.id !== subtaskId);
      const completedCount = updatedSubtasks.filter((st) => st.done).length;
      const progress = updatedSubtasks.length > 0 ? (completedCount / updatedSubtasks.length) * 100 : 0;

      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: updatedSubtasks,
          progress: Math.round(progress),
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { 
        subtasks: updatedSubtasks,
        progress: Math.round(progress)
      });
    }
  },

  updateSubtask: async (taskId, subtaskId, title) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const updatedSubtasks = existing.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, title } : st
      );
      
      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: updatedSubtasks,
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { subtasks: updatedSubtasks });
    }
  },

  deleteMilestone: async (taskId, milestoneId) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const updatedMilestones = existing.milestones.filter((m) => m.id !== milestoneId);
      
      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          milestones: updatedMilestones,
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { milestones: updatedMilestones });
    }
  },

  updateMilestone: async (taskId, milestoneId, title, targetDate) => {
    const state = get();
    const existing = state.taskDetails.get(taskId);
    if (existing) {
      const updatedMilestones = existing.milestones.map((m) =>
        m.id === milestoneId ? { ...m, title, targetDate } : m
      );
      
      set((state) => {
        const newTaskDetails = new Map(state.taskDetails);
        newTaskDetails.set(taskId, {
          ...existing,
          milestones: updatedMilestones,
        });
        return { taskDetails: newTaskDetails };
      });
      
      // Update in Firebase
      await firestoreTaskDetails.update(taskId, { milestones: updatedMilestones });
    }
  },

  // Recurrence operations (local for now)
  setRecurrence: (taskId, recurrence) =>
    set((state) => {
      const newRecurrences = new Map(state.recurrences);
      newRecurrences.set(taskId, { ...recurrence, taskId });
      return { recurrences: newRecurrences };
    }),

  completeRecurrenceInstance: (taskId, date) =>
    set((state) => {
      const newRecurrences = new Map(state.recurrences);
      const existing = newRecurrences.get(taskId);
      if (existing) {
        newRecurrences.set(taskId, {
          ...existing,
          completedInstances: [...existing.completedInstances, date],
        });
      }
      return { recurrences: newRecurrences };
    }),

  // Time block operations (local for now)
  addTimeBlock: (blockData) =>
    set((state) => ({
      timeBlocks: [
        ...state.timeBlocks,
        {
          ...blockData,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),

  updateTimeBlock: (id, updates) =>
    set((state) => ({
      timeBlocks: state.timeBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    })),

  deleteTimeBlock: (id) =>
    set((state) => ({
      timeBlocks: state.timeBlocks.filter((block) => block.id !== id),
    })),

  // Initialize Firebase listeners
  initializeFirebase: () => {
    // Prevent multiple initializations
    if (isFirebaseInitialized) {
      console.log('⚠️ Firebase already initialized, skipping...');
      return;
    }
    
    try {
      console.log('🚀 Initializing Firebase connections...');
      isFirebaseInitialized = true;
      
      // Subscribe to user data (daily todos) FIRST
      firestoreUserData.subscribe((data) => {
        console.log(`📥 Firebase subscriber triggered: Received ${data.dailyTodos.length} daily todos`);
        console.log('📥 Daily todos IDs from Firebase:', data.dailyTodos);
        console.log('📥 About to SET dailyTodos in Zustand store...');
        set({ dailyTodos: data.dailyTodos });
        console.log('✅ dailyTodos SET in Zustand store');
        const currentState = get();
        console.log('✅ Verification - Current dailyTodos in store:', currentState.dailyTodos);
        console.log('✅ Verification - dailyTodos length:', currentState.dailyTodos.length);
      });
      
      // THEN Initialize user data document
      firestoreUserData.initialize().catch(console.error);

      // Subscribe to tasks
      firestoreTasks.subscribe((tasks) => {
        console.log(`Received ${tasks.length} tasks from Firebase`);
        set({ tasks });
        
        // Trigger auto-backup after data loads
        const state = get();
        triggerAutoBackup(tasks, state.taskDetails, state.dailyTodos).catch(console.error);
      });

      // Subscribe to task details
      firestoreTaskDetails.subscribe((details) => {
        const taskDetailsMap = new Map();
        Object.entries(details).forEach(([taskId, detail]) => {
          taskDetailsMap.set(taskId, detail);
        });
        console.log(`Received ${taskDetailsMap.size} task details from Firebase`);
        set({ taskDetails: taskDetailsMap });
      });
      
      // Set up interval for midnight cleanup (runs every 15 minutes, but only executes at midnight)
      setInterval(() => {
        get().midnightCleanup().catch(console.error);
      }, 15 * 60 * 1000); // Every 15 minutes
      
      // Set up interval for evening cleanup (runs every 15 minutes, but only executes 8 PM - midnight)
      setInterval(() => {
        get().eveningCleanup().catch(console.error);
      }, 15 * 60 * 1000); // Every 15 minutes
      
      console.log('Firebase initialization completed successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
}));