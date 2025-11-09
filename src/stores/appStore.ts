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

interface AppState {
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

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;

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
}

// Default areas configuration - circles with all four small circles overlapping
const defaultAreas: Area[] = [
  { id: 'school', name: 'Schule', color: '#003049', position: { x: 340, y: 300 }, radius: 160 },
  { id: 'sport', name: 'Sport', color: '#669bbc', position: { x: 460, y: 300 }, radius: 160 },
  { id: 'business', name: 'Geschäft', color: '#c1121f', position: { x: 340, y: 380 }, radius: 160 },
  { id: 'projects', name: 'Projekte', color: '#780000', position: { x: 460, y: 380 }, radius: 160 },
  { id: 'leisure', name: 'Freizeitaktivitäten', color: '#669bbc', position: { x: 400, y: 340 }, radius: 400 },
];

const defaultFilters: FilterConfig = {
  areas: [],
  types: [],
  priorities: [],
  timeRange: 'all',
  focusMode: false,
};

// LocalStorage helpers
const STORAGE_KEY = 'mindmap-app-data';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        tasks: data.tasks || [],
        dailyTodos: data.dailyTodos || [],
        taskDetails: new Map<string, TaskDetail>(data.taskDetails || []),
        recurrences: new Map<string, Recurrence>(data.recurrences || []),
        timeBlocks: data.timeBlocks || [],
      };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return {
    tasks: [],
    dailyTodos: [],
    taskDetails: new Map<string, TaskDetail>(),
    recurrences: new Map<string, Recurrence>(),
    timeBlocks: [],
  };
};

const saveToStorage = (tasks: Task[], dailyTodos: string[], taskDetails: Map<string, TaskDetail>, recurrences: Map<string, Recurrence>, timeBlocks: TimeBlock[]) => {
  try {
    const dataToSave = {
      tasks,
      dailyTodos,
      taskDetails: Array.from(taskDetails.entries()),
      recurrences: Array.from(recurrences.entries()),
      timeBlocks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const initialData = loadFromStorage();

export const useAppStore = create<AppState>((set) => ({
  // Initial state - load from localStorage
  currentView: 'map',
  tasks: initialData.tasks,
  taskDetails: initialData.taskDetails,
  recurrences: initialData.recurrences,
  timeBlocks: initialData.timeBlocks,
  areas: defaultAreas,
  filters: defaultFilters,
  isDailyPlanningMode: false,
  dailyTodos: initialData.dailyTodos,

  // View management
  setCurrentView: (view) => set({ currentView: view }),

  // Daily planning mode
  setDailyPlanningMode: (enabled) => set({ isDailyPlanningMode: enabled }),
  addToDailyTodos: (taskId) =>
    set((state) => {
      const newDailyTodos = state.dailyTodos.includes(taskId)
        ? state.dailyTodos
        : [...state.dailyTodos, taskId];
      saveToStorage(state.tasks, newDailyTodos, state.taskDetails, state.recurrences, state.timeBlocks);
      return { dailyTodos: newDailyTodos };
    }),
  removeFromDailyTodos: (taskId) =>
    set((state) => {
      const newDailyTodos = state.dailyTodos.filter((id) => id !== taskId);
      saveToStorage(state.tasks, newDailyTodos, state.taskDetails, state.recurrences, state.timeBlocks);
      return { dailyTodos: newDailyTodos };
    }),
  clearDailyTodos: () => set((state) => {
    saveToStorage(state.tasks, [], state.taskDetails, state.recurrences, state.timeBlocks);
    return { dailyTodos: [] };
  }),

  // Filter management
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  // Task operations
  addTask: (taskData) =>
    set((state) => {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        isHybrid: taskData.areas.length > 1,
      };

      const newTaskDetails = new Map(state.taskDetails);
      
      // Initialize task detail for large tasks
      if (newTask.type === 'large') {
        const detail: TaskDetail = {
          taskId: newTask.id,
          goal: '',
          progress: 0,
          subtasks: [],
          milestones: [],
        };
        newTaskDetails.set(newTask.id, detail);
      }

      const newTasks = [...state.tasks, newTask];
      saveToStorage(newTasks, state.dailyTodos, newTaskDetails, state.recurrences, state.timeBlocks);

      return {
        tasks: newTasks,
        taskDetails: newTaskDetails,
      };
    }),

  updateTask: (id, updates) =>
    set((state) => {
      const newTasks = state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, isHybrid: (updates.areas || task.areas).length > 1 }
          : task
      );
      saveToStorage(newTasks, state.dailyTodos, state.taskDetails, state.recurrences, state.timeBlocks);
      return { tasks: newTasks };
    }),

  deleteTask: (id) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const newRecurrences = new Map(state.recurrences);
      newTaskDetails.delete(id);
      newRecurrences.delete(id);

      const newTasks = state.tasks.filter((task) => task.id !== id);
      const newTimeBlocks = state.timeBlocks.filter((block) => block.taskId !== id);
      const newDailyTodos = state.dailyTodos.filter((todoId) => todoId !== id);

      saveToStorage(newTasks, newDailyTodos, newTaskDetails, newRecurrences, newTimeBlocks);

      return {
        tasks: newTasks,
        taskDetails: newTaskDetails,
        recurrences: newRecurrences,
        timeBlocks: newTimeBlocks,
        dailyTodos: newDailyTodos,
      };
    }),

  toggleTaskComplete: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completedAt: task.completedAt ? undefined : new Date(),
            }
          : task
      ),
    })),

  // Large task operations
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
        // Calculate next order number
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

  addMilestone: (taskId: string, title: string, targetDate?: Date) =>
    set((state) => {
      const newTaskDetails = new Map(state.taskDetails);
      const existing = newTaskDetails.get(taskId);
      if (existing) {
        // Calculate next order number
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

  // Recurrence operations
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

  // Time block operations
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
}));
