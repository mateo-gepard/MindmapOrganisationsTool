import React, { useState } from 'react';
import type { Task, TaskType, Priority, AreaId } from '../../types';
import { useAppStore } from '../../stores/firebaseStore';
import { toISODateString } from '../../utils/dateHelpers';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, areas } = useAppStore();
  
  // Safety check for areas
  if (!areas || areas.length === 0) {
    console.error('Areas not loaded yet');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <p className="text-gray-700">Lade Bereiche...</p>
        </div>
      </div>
    );
  }
  
  const [title, setTitle] = useState(task.title);
  const [type, setType] = useState<TaskType>(task.type);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [selectedAreas, setSelectedAreas] = useState<AreaId[]>(task.areas);
  const [dueDate, setDueDate] = useState(toISODateString(task.dueDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateTask(task.id, {
      title,
      type,
      priority,
      areas: selectedAreas,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isHybrid: selectedAreas.length > 1,
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const toggleArea = (areaId: AreaId) => {
    if (selectedAreas.includes(areaId)) {
      // Don't allow removing the last area
      if (selectedAreas.length > 1) {
        setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
      }
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Aufgabe bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('repetitive')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  type === 'repetitive'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                🔄 Wiederholend
              </button>
              <button
                type="button"
                onClick={() => setType('one-time')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  type === 'one-time'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                ✓ Einmalig
              </button>
              <button
                type="button"
                onClick={() => setType('large')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  type === 'large'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Projekt
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorität
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  priority === 'high'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Hoch
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Mittel
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  priority === 'low'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Niedrig
              </button>
            </div>
          </div>

          {/* Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bereiche (mindestens einer)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id)}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    selectedAreas.includes(area.id)
                      ? 'border-opacity-100 bg-opacity-10'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: selectedAreas.includes(area.id) ? area.color : undefined,
                    backgroundColor: selectedAreas.includes(area.id) ? `${area.color}15` : undefined,
                    color: selectedAreas.includes(area.id) ? area.color : undefined,
                  }}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fälligkeitsdatum (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Löschen
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
