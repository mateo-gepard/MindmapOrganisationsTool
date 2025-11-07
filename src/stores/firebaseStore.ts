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
  toggleTaskComplete: (id: string) => Promise<void>;

  // Large task operations
  updateTaskDetail: (taskId: string, detail: Partial<TaskDetail>) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addMilestone: (taskId: string, title: string, targetDate: Date) => void;

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
    set({ currentUser: username });
    localStorage.setItem('mindmap-username', username);
    // Reinitialize Firebase with new user
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
      set({ dailyTodos: newDailyTodos });
      await firestoreUserData.updateDailyTodos(newDailyTodos);
    }
  },
  
  removeFromDailyTodos: async (taskId) => {
    const state = get();
    const newDailyTodos = state.dailyTodos.filter((id) => id !== taskId);
    set({ dailyTodos: newDailyTodos });
    await firestoreUserData.updateDailyTodos(newDailyTodos);
  },
  
  clearDailyTodos: async () => {
    set({ dailyTodos: [] });
    await firestoreUserData.updateDailyTodos([]);
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

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      const updates = {
        completedAt: task.completedAt ? undefined : new Date(),
      };
      await get().updateTask(id, updates);
    }
  },

  // Large task operations (kept for local state management)
  updateTaskDetail: (taskId, detail) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
      if (existing) {
        newTaskDetails.set(taskId, { ...existing, ...detail });
      }
      return { taskDetails: newTaskDetails };
    }),

  addSubtask: (taskId: string, title: string) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
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
        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: [...existing.subtasks, newSubtask],
        });
      }
      return { taskDetails: newTaskDetails };
    }),

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
      if (existing) {
        const updatedSubtasks = existing.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        const completedCount = updatedSubtasks.filter((st) => st.done).length;
        const progress = updatedSubtasks.length > 0 ? (completedCount / updatedSubtasks.length) * 100 : 0;

        newTaskDetails.set(taskId, {
          ...existing,
          subtasks: updatedSubtasks,
          progress: Math.round(progress),
        });
      }
      return { taskDetails: newTaskDetails };
    }),

  addMilestone: (taskId: string, title: string, targetDate: Date) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
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
        newTaskDetails.set(taskId, {
          ...existing,
          milestones: [...existing.milestones, newMilestone],
        });
      }
      return { taskDetails: newTaskDetails };
    }),

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
    try {
      console.log('Initializing Firebase connections...');
      
      // Initialize user data
      firestoreUserData.initialize().catch(console.error);

      // Subscribe to tasks
      firestoreTasks.subscribe((tasks) => {
        console.log(`Received ${tasks.length} tasks from Firebase`);
        set({ tasks });
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

      // Subscribe to user data (daily todos)
      firestoreUserData.subscribe((data) => {
        console.log(`Received daily todos: ${data.dailyTodos.length} items`);
        set({ dailyTodos: data.dailyTodos });
      });
      
      console.log('Firebase initialization completed successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
}));