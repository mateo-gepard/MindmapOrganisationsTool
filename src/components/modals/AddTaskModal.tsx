import React, { useState } from 'react';
import { useAppStore } from '../../stores/firebaseStore';
import type { TaskType, Priority, AreaId } from '../../types';

interface AddTaskModalProps {
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose }) => {
  const { addTask, areas } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('one-time');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedAreas, setSelectedAreas] = useState<AreaId[]>(['school']);
  const [dueDate, setDueDate] = useState('');

  const toggleArea = (areaId: AreaId) => {
    if (selectedAreas.includes(areaId)) {
      // Don't allow removing the last area
      if (selectedAreas.length > 1) {
        setSelectedAreas(selectedAreas.filter((id) => id !== areaId));
      }
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Bitte gib einen Titel ein');
      return;
    }

    // Find the first selected area to get initial position
    const firstArea = areas.find((a) => a.id === selectedAreas[0]);
    const position = firstArea
      ? { x: firstArea.position.x - 30, y: firstArea.position.y - 30 }
      : { x: 400, y: 300 };

    addTask({
      title: title.trim(),
      type,
      priority,
      areas: selectedAreas,
      position,
      isHybrid: selectedAreas.length > 1,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Neue Aufgabe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="z.B. Hausaufgaben machen"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('repetitive')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  type === 'repetitive'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Wiederkehrend</div>
                <div className="text-xs mt-1">⟳</div>
              </button>
              <button
                type="button"
                onClick={() => setType('one-time')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  type === 'one-time'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Einmalig</div>
                <div className="text-xs mt-1">□</div>
              </button>
              <button
                type="button"
                onClick={() => setType('large')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  type === 'large'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Projekt</div>
                <div className="text-xs mt-1">△</div>
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorität
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  priority === 'high'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Hoch</div>
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Mittel</div>
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  priority === 'low'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Niedrig</div>
              </button>
            </div>
          </div>

          {/* Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bereiche * (mindestens einer)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {areas
                .filter((area) => area.id !== 'leisure')
                .map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedAreas.includes(area.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Aufgabe erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
