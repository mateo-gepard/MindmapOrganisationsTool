// Area IDs representing the five life areas
export type AreaId = 'school' | 'sport' | 'business' | 'projects' | 'leisure';

// Task types represented by different pin shapes
export type TaskType = 'repetitive' | 'one-time' | 'large';

// Priority levels
export type Priority = 'low' | 'medium' | 'high';

// Area definition
export interface Area {
  id: AreaId;
  name: string;
  color: string;
  position: { x: number; y: number };
  radius: number;
}

// Core Task interface
export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  dueDate?: Date;
  areas: AreaId[]; // 1-2 areas for hybrid tasks
  isHybrid: boolean;
  position?: { x: number; y: number }; // Position on map
  createdAt: Date;
  completedAt?: Date;
  // For repetitive tasks
  recurrence?: {
    interval: 'daily' | 'weekly' | 'monthly';
    frequency?: number; // e.g., every 2 days, every 3 weeks
    daysOfWeek?: number[]; // For weekly: 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // For monthly: 1-31
  };
  lastCompletedAt?: Date; // Track last completion for repetitive tasks
}

// Extended details for large/project tasks
export interface TaskDetail {
  taskId: string;
  goal: string;
  progress: number; // 0-100
  subtasks: Subtask[];
  milestones: Milestone[];
}

// Recurrence configuration for repetitive tasks
export interface Recurrence {
  taskId: string;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startTime?: string; // HH:mm format
  duration?: number; // minutes
  nextOccurrence?: Date;
  completedInstances: Date[]; // Track completed instances
}

// Subtask for large tasks
export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  dueDate?: Date;
  createdAt: Date;
  order: number;
}

// Milestone for large tasks
export interface Milestone {
  id: string;
  title: string;
  targetDate?: Date;
  completed: boolean;
  order: number;
}

// Time block for calendar view
export interface TimeBlock {
  id: string;
  taskId: string;
  start: Date;
  end: Date;
  source: 'local'; // Could be extended with 'external' for calendar sync
}

// Filter configuration
export interface FilterConfig {
  areas: AreaId[];
  types: TaskType[];
  priorities: Priority[];
  timeRange: 'today' | 'week' | 'all';
  focusMode: boolean;
}

// View type
export type ViewType = 'map' | 'whiteboard' | 'calendar' | 'daily';

// Archive snapshot for daily backups
export interface ArchiveSnapshot {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'morning' | 'evening'; // Two backups per day
  tasks: Task[];
  taskDetails: { [key: string]: TaskDetail };
  dailyTodos: string[];
}

// Completed task archive entry
export interface CompletedTaskArchive {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  type: TaskType;
  priority: Priority;
  areas: AreaId[];
  createdAt: Date;
  completedAt: Date;
  wasRepetitive: boolean;
  recurrence?: Task['recurrence'];
}
