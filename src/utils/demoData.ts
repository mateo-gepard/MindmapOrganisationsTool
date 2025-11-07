import type { Task, AreaId } from '../types';

// Demo tasks - positioned to show overlapping areas
export const demoTasks: Omit<Task, 'id' | 'createdAt'>[] = [
  // School area
  {
    title: 'Mathe Hausaufgaben',
    type: 'one-time',
    priority: 'high',
    dueDate: new Date(2025, 10, 10),
    areas: ['school' as AreaId],
    isHybrid: false,
    position: { x: 240, y: 190 },
  },
  {
    title: 'Englisch Vokabeln',
    type: 'one-time',
    priority: 'medium',
    dueDate: new Date(2025, 10, 8),
    areas: ['school' as AreaId],
    isHybrid: false,
    position: { x: 300, y: 210 },
  },
  // School × Sport intersection
  {
    title: 'Schulsport Training',
    type: 'repetitive',
    priority: 'medium',
    areas: ['school' as AreaId, 'sport' as AreaId],
    isHybrid: true,
    position: { x: 400, y: 210 },
  },
  // Sport area
  {
    title: 'Fitnessstudio',
    type: 'repetitive',
    priority: 'medium',
    areas: ['sport' as AreaId],
    isHybrid: false,
    position: { x: 480, y: 190 },
  },
  {
    title: 'Joggen',
    type: 'repetitive',
    priority: 'low',
    areas: ['sport' as AreaId],
    isHybrid: false,
    position: { x: 540, y: 220 },
  },
  // School × Business intersection
  {
    title: 'Praktikum Bericht',
    type: 'one-time',
    priority: 'high',
    dueDate: new Date(2025, 10, 11),
    areas: ['school' as AreaId, 'business' as AreaId],
    isHybrid: true,
    position: { x: 280, y: 340 },
  },
  // Business area
  {
    title: 'Kundenpräsentation',
    type: 'one-time',
    priority: 'high',
    dueDate: new Date(2025, 10, 12),
    areas: ['business' as AreaId],
    isHybrid: false,
    position: { x: 240, y: 430 },
  },
  {
    title: 'Budget Plan',
    type: 'large',
    priority: 'medium',
    areas: ['business' as AreaId],
    isHybrid: false,
    position: { x: 300, y: 480 },
  },
  // Business × Projects intersection
  {
    title: 'Website Redesign',
    type: 'large',
    priority: 'high',
    dueDate: new Date(2025, 10, 15),
    areas: ['business' as AreaId, 'projects' as AreaId],
    isHybrid: true,
    position: { x: 400, y: 460 },
  },
  // Projects area
  {
    title: 'App-Entwicklung',
    type: 'large',
    priority: 'high',
    dueDate: new Date(2025, 11, 1),
    areas: ['projects' as AreaId],
    isHybrid: false,
    position: { x: 480, y: 430 },
  },
  {
    title: 'Code Review',
    type: 'one-time',
    priority: 'medium',
    dueDate: new Date(2025, 10, 9),
    areas: ['projects' as AreaId],
    isHybrid: false,
    position: { x: 540, y: 480 },
  },
  // Sport × Projects intersection
  {
    title: 'Fitness App Projekt',
    type: 'large',
    priority: 'medium',
    areas: ['sport' as AreaId, 'projects' as AreaId],
    isHybrid: true,
    position: { x: 520, y: 340 },
  },
  // Leisure area (outer circle)
  {
    title: 'Klavierübung',
    type: 'repetitive',
    priority: 'low',
    areas: ['leisure' as AreaId],
    isHybrid: false,
    position: { x: 200, y: 340 },
  },
  {
    title: 'Buch lesen',
    type: 'repetitive',
    priority: 'low',
    areas: ['leisure' as AreaId],
    isHybrid: false,
    position: { x: 600, y: 340 },
  },
  {
    title: 'Meditation',
    type: 'repetitive',
    priority: 'low',
    areas: ['leisure' as AreaId],
    isHybrid: false,
    position: { x: 400, y: 580 },
  },
  {
    title: 'Netflix',
    type: 'repetitive',
    priority: 'low',
    areas: ['leisure' as AreaId],
    isHybrid: false,
    position: { x: 400, y: 140 },
  },
];

export function initializeDemoData() {
  // This function can be called to populate the store with demo data
  return demoTasks;
}
