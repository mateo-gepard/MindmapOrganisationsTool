import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { ProjectDetailModal } from '../modals/ProjectDetailModal';
import type { Task, AreaId } from '../../types';

interface StickyNoteProps {
  task: Task;
  areaColor: string;
  onToggle: () => void;
  onClick: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ task, areaColor, onToggle, onClick }) => {
  const isCompleted = !!task.completedAt;
  const { taskDetails } = useAppStore();
  const detail = task.type === 'large' ? taskDetails.get(task.id) : null;

  const getTypeLabel = () => {
    switch (task.type) {
      case 'repetitive': return '🔄 Wiederholend';
      case 'one-time': return '✓ Einmalig';
      case 'large': return '📊 Projekt';
    }
  };

  const getPriorityStyle = () => {
    switch (task.priority) {
      case 'high': return 'border-t-4 border-t-red-500';
      case 'medium': return 'border-t-4 border-t-yellow-500';
      case 'low': return 'border-t-4 border-t-green-500';
    }
  };

  return (
    <div
      className={`relative p-3 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer ${getPriorityStyle()} ${
        isCompleted ? 'opacity-60' : ''
      }`}
      style={{
        backgroundColor: `${areaColor}15`,
        borderLeft: `3px solid ${areaColor}`,
        minHeight: '120px',
      }}
      onClick={onClick}
    >
      {/* Checkbox in corner */}
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute top-2 right-2 w-4 h-4 cursor-pointer"
      />

      {/* Type badge */}
      <div className="text-[10px] font-semibold mb-1 text-gray-600">
        {getTypeLabel()}
      </div>

      {/* Title */}
      <h3 className={`font-bold text-sm mb-2 pr-6 leading-tight ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
        {task.title}
      </h3>

      {/* Details */}
      <div className="space-y-1 text-xs">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-gray-700">
            <span>📅</span>
            <span>{new Date(task.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
          </div>
        )}

        {task.isHybrid && (
          <div className="text-purple-600 font-medium text-[10px]">
            ⚡ Hybrid
          </div>
        )}

        {/* Progress for large tasks */}
        {task.type === 'large' && detail && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="font-medium">Fortschritt</span>
              <span className="font-bold">{detail.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all"
                style={{ width: `${detail.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-600">
              <span>{detail.subtasks.filter(st => st.done).length}/{detail.subtasks.length}</span>
              <span>🏁 {detail.milestones.filter(m => m.completed).length}/{detail.milestones.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const WhiteboardView: React.FC = () => {
  const { tasks, areas, toggleTaskComplete } = useAppStore();
  const [projectDetailTask, setProjectDetailTask] = useState<Task | null>(null);

  const areaColorMap: Record<AreaId, string> = {
    school: '#3B82F6',
    sport: '#10B981',
    business: '#8B5CF6',
    projects: '#F59E0B',
    leisure: '#EC4899',
  };

  // Filter out leisure tasks from main areas
  const mainAreas = areas.filter(a => a.id !== 'leisure');
  const leisureArea = areas.find(a => a.id === 'leisure');

  const getTasksForArea = (areaId: AreaId): Task[] => {
    return tasks.filter((task) => task.areas.includes(areaId));
  };

  const handleTaskClick = (task: Task) => {
    if (task.type === 'large') {
      setProjectDetailTask(task);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whiteboard</h1>
            <p className="text-sm text-gray-600">{tasks.length} Aufgaben insgesamt</p>
          </div>
        </div>

        {/* Main Areas Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {mainAreas.map((area) => {
            const areaTasks = getTasksForArea(area.id);
            return (
              <div key={area.id} className="space-y-3">
                {/* Area Header - Compact */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: areaColorMap[area.id] }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{area.name}</h2>
                    <p className="text-xs text-gray-600">{areaTasks.length}</p>
                  </div>
                </div>

                {/* Sticky Notes */}
                <div className="space-y-2">
                  {areaTasks.length === 0 ? (
                    <div className="text-center py-6 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-xs text-gray-400 italic">Leer</p>
                    </div>
                  ) : (
                    areaTasks.map((task) => (
                      <StickyNote
                        key={task.id}
                        task={task}
                        areaColor={areaColorMap[area.id]}
                        onToggle={() => toggleTaskComplete(task.id)}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leisure Area - Full Width with Columns */}
        {leisureArea && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-pink-300">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: areaColorMap.leisure }}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{leisureArea.name}</h2>
                <p className="text-xs text-gray-600">
                  {getTasksForArea('leisure').length} Aktivitäten
                </p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {getTasksForArea('leisure').map((task) => (
                <StickyNote
                  key={task.id}
                  task={task}
                  areaColor={areaColorMap.leisure}
                  onToggle={() => toggleTaskComplete(task.id)}
                  onClick={() => handleTaskClick(task)}
                />
              ))}
              {getTasksForArea('leisure').length === 0 && (
                <div className="col-span-6 text-center py-8 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-400 italic">Keine Freizeitaktivitäten</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {projectDetailTask && (
        <ProjectDetailModal
          task={projectDetailTask}
          onClose={() => setProjectDetailTask(null)}
        />
      )}
    </div>
  );
};
