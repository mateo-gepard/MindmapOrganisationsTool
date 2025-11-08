import React, { useState, useMemo } from 'react';
import type { Task, Subtask, Milestone } from '../../types';
import { useAppStore } from '../../stores/firebaseStore';

interface ProjectDetailModalProps {
  task: Task;
  onClose: () => void;
}

type TaskItem = 
  | { type: 'subtask'; data: Subtask; index: number }
  | { type: 'milestone'; data: Milestone; index: number };

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ task, onClose }) => {
  const { taskDetails, updateTaskDetail, addSubtask, toggleSubtask, addMilestone } = useAppStore();
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'subtask' | 'milestone'>('subtask');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const detail = taskDetails.get(task.id);
  
  // Safety check - if no detail exists yet, show loading or create initial state
  React.useEffect(() => {
    if (detail && !editingGoal) {
      setGoalText(detail.goal || '');
    }
  }, [detail, editingGoal]);
  
  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <p className="text-gray-700">Lade Projektdetails...</p>
        </div>
      </div>
    );
  }
  
  // Create combined list of items with order
  const combinedItems = useMemo(() => {
    if (!detail) return [];
    
    const items: TaskItem[] = [
      ...detail.subtasks.map((st, index) => ({ type: 'subtask' as const, data: st, index })),
      ...detail.milestones.map((m, index) => ({ type: 'milestone' as const, data: m, index })),
    ];
    
    // Sort by order field
    items.sort((a, b) => a.data.order - b.data.order);
    
    return items;
  }, [detail]);
  
  // Calculate progress to next milestone
  const progressToNextMilestone = useMemo(() => {
    if (!detail) return 0;
    
    const items = combinedItems;
    const nextMilestoneIndex = items.findIndex(
      item => item.type === 'milestone' && !item.data.completed
    );
    
    if (nextMilestoneIndex === -1) {
      return detail.progress;
    }
    
    // Count completed tasks before next milestone
    const tasksBeforeMilestone = items.slice(0, nextMilestoneIndex);
    const completedBeforeMilestone = tasksBeforeMilestone.filter(
      item => item.type === 'subtask' && item.data.done
    ).length;
    const totalBeforeMilestone = tasksBeforeMilestone.filter(
      item => item.type === 'subtask'
    ).length;
    
    if (totalBeforeMilestone === 0) return 0;
    return Math.round((completedBeforeMilestone / totalBeforeMilestone) * 100);
  }, [detail, combinedItems]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    
    if (newItemType === 'subtask') {
      addSubtask(task.id, newItemTitle.trim());
    } else {
      const date = newMilestoneDate ? new Date(newMilestoneDate) : new Date();
      addMilestone(task.id, newItemTitle.trim(), date);
    }
    
    setNewItemTitle('');
    setNewMilestoneDate('');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || !detail) return;
    
    const items = [...combinedItems];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    
    // Update order values for all items
    const updatedSubtasks = detail.subtasks.map(st => {
      const newIndex = items.findIndex(item => item.type === 'subtask' && item.data.id === st.id);
      return { ...st, order: newIndex };
    });
    
    const updatedMilestones = detail.milestones.map(m => {
      const newIndex = items.findIndex(item => item.type === 'milestone' && item.data.id === m.id);
      return { ...m, order: newIndex };
    });
    
    updateTaskDetail(task.id, {
      subtasks: updatedSubtasks,
      milestones: updatedMilestones,
    });
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveGoal = () => {
    updateTaskDetail(task.id, { goal: goalText });
    setEditingGoal(false);
  };

  const nextMilestone = useMemo(() => {
    const nextMilestoneIndex = combinedItems.findIndex(
      item => item.type === 'milestone' && !item.data.completed
    );
    
    if (nextMilestoneIndex === -1) return null;
    
    return combinedItems[nextMilestoneIndex].data as Milestone;
  }, [combinedItems]);

  if (!detail) return null;

  const completedSubtasks = detail.subtasks.filter(st => st.done).length;
  const totalSubtasks = detail.subtasks.length;
  const completedMilestones = detail.milestones.filter(m => m.completed).length;
  const totalMilestones = detail.milestones.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{task.title}</h2>
              <p className="text-purple-100 text-sm mt-1">Großes Projekt</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar to Next Milestone */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                {nextMilestone 
                  ? `Fortschritt bis: ${nextMilestone.title}`
                  : 'Gesamtfortschritt'}
              </span>
              <span className="font-bold">{progressToNextMilestone}%</span>
            </div>
            <div className="w-full bg-purple-800 bg-opacity-30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progressToNextMilestone}%` }}
              />
            </div>
            {nextMilestone && nextMilestone.targetDate && (
              <div className="text-xs text-purple-100">
                Zieldatum: {new Date(nextMilestone.targetDate).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Goal Section */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">🎯 Projektziel</h3>
              {!editingGoal && (
                <button
                  onClick={() => {
                    setGoalText(detail.goal);
                    setEditingGoal(true);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Bearbeiten
                </button>
              )}
            </div>
            {editingGoal ? (
              <div className="space-y-2">
                <textarea
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Was ist das Ziel dieses Projekts?"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGoal}
                    className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => setEditingGoal(false)}
                    className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">
                {detail.goal || 'Kein Ziel definiert. Klicke auf "Bearbeiten" um ein Ziel hinzuzufügen.'}
              </p>
            )}
          </div>

          {/* Combined Tasks and Milestones List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>
                <span className="text-xl mr-2">📋</span>
                Aufgaben & Meilensteine
              </span>
              <span className="text-sm text-gray-600">
                {completedSubtasks}/{totalSubtasks} Aufgaben · {completedMilestones}/{totalMilestones} Meilensteine
              </span>
            </h3>
            
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {combinedItems.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Noch keine Aufgaben oder Meilensteine</p>
              ) : (
                combinedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.data.id}`}
                    draggable={false}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    } ${
                      item.type === 'milestone'
                        ? item.data.completed
                          ? 'border-green-300 bg-gradient-to-r from-green-50 to-green-100'
                          : 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100'
                        : item.data.done
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {/* Drag handle */}
                    <div 
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      className="text-gray-400 cursor-move hover:text-gray-600 select-none"
                    >
                      ⋮⋮
                    </div>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={item.type === 'milestone' ? item.data.completed : item.data.done}
                      onChange={() => {
                        if (item.type === 'milestone') {
                          const updatedMilestones = detail.milestones.map((m) =>
                            m.id === item.data.id ? { ...m, completed: !m.completed } : m
                          );
                          updateTaskDetail(task.id, { milestones: updatedMilestones });
                        } else {
                          toggleSubtask(task.id, item.data.id);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      {item.type === 'milestone' ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600 font-bold">🏁</span>
                            <span
                              className={`font-bold ${
                                item.data.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {item.data.title}
                            </span>
                          </div>
                          {item.data.targetDate && (
                            <p className="text-xs text-gray-500 ml-6">
                              Zieldatum: {new Date(item.data.targetDate).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`${
                            item.data.done ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {item.data.title}
                        </span>
                      )}
                    </div>

                    {/* Created date for subtasks */}
                    {item.type === 'subtask' && (
                      <span className="text-xs text-gray-400">
                        {new Date(item.data.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Item Form */}
            <form onSubmit={handleAddItem} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewItemType('subtask')}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    newItemType === 'subtask'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ✓ Teilaufgabe
                </button>
                <button
                  type="button"
                  onClick={() => setNewItemType('milestone')}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    newItemType === 'milestone'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏁 Meilenstein
                </button>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={newItemType === 'milestone' ? 'Neuer Meilenstein...' : 'Neue Teilaufgabe...'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {newItemType === 'milestone' && (
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="Optional"
                  />
                )}
                <button
                  type="submit"
                  disabled={!newItemTitle.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  + Hinzufügen
                </button>
              </div>
            </form>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{detail.progress}%</div>
              <div className="text-sm text-gray-600">Gesamt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedSubtasks}</div>
              <div className="text-sm text-gray-600">Erledigt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{completedMilestones}/{totalMilestones}</div>
              <div className="text-sm text-gray-600">Meilensteine</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
