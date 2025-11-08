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
  
  // Recurrence settings for repetitive tasks
  const [recurrenceInterval, setRecurrenceInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1]); // Monday default

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Bitte gib einen Titel ein');
      return;
    }

    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);

    try {
      // Find the first selected area to get initial position
      const firstArea = areas.find((a) => a.id === selectedAreas[0]);
      const position = firstArea
        ? { x: firstArea.position.x - 30, y: firstArea.position.y - 30 }
        : { x: 400, y: 300 };

      const taskData: any = {
        title: title.trim(),
        type,
        priority,
        areas: selectedAreas,
        position,
        isHybrid: selectedAreas.length > 1,
      };

      // Only add dueDate if it has a value
      if (dueDate) {
        taskData.dueDate = new Date(dueDate);
      }

      // Add recurrence settings for repetitive tasks
      if (type === 'repetitive') {
        taskData.recurrence = {
          interval: recurrenceInterval,
          frequency: recurrenceFrequency,
          ...(recurrenceInterval === 'weekly' && { daysOfWeek: selectedDaysOfWeek }),
        };
      }

      await addTask(taskData);

      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Fehler beim Erstellen der Aufgabe. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
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
                    ? 'border-navy bg-navy/10 text-navy'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Wiederkehrend</div>
              </button>
              <button
                type="button"
                onClick={() => setType('one-time')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  type === 'one-time'
                    ? 'border-blue bg-blue/10 text-blue'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Einmalig</div>
              </button>
              <button
                type="button"
                onClick={() => setType('large')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  type === 'large'
                    ? 'border-crimson bg-crimson/10 text-crimson'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Projekt</div>
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

          {/* Recurrence Settings - only for repetitive tasks */}
          {type === 'repetitive' && (
            <div className="bg-navy/5 p-4 rounded-lg border-2 border-navy/20">
              <label className="block text-sm font-medium text-navy mb-3">
                🔄 Wiederholungs-Intervall
              </label>
              
              {/* Interval Type */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setRecurrenceInterval('daily')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    recurrenceInterval === 'daily'
                      ? 'bg-navy text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Täglich
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceInterval('weekly')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    recurrenceInterval === 'weekly'
                      ? 'bg-navy text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Wöchentlich
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceInterval('monthly')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    recurrenceInterval === 'monthly'
                      ? 'bg-navy text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Monatlich
                </button>
              </div>

              {/* Frequency */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Alle 
                  <select
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(Number(e.target.value))}
                    className="mx-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {recurrenceInterval === 'daily' && (recurrenceFrequency === 1 ? 'Tag' : 'Tage')}
                  {recurrenceInterval === 'weekly' && (recurrenceFrequency === 1 ? 'Woche' : 'Wochen')}
                  {recurrenceInterval === 'monthly' && (recurrenceFrequency === 1 ? 'Monat' : 'Monate')}
                </label>
              </div>

              {/* Days of Week - only for weekly */}
              {recurrenceInterval === 'weekly' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2">An diesen Tagen:</label>
                  <div className="grid grid-cols-7 gap-1">
                    {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (selectedDaysOfWeek.includes(index)) {
                            setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== index));
                          } else {
                            setSelectedDaysOfWeek([...selectedDaysOfWeek, index].sort());
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          selectedDaysOfWeek.includes(index)
                            ? 'bg-navy text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bereiche * (mindestens einer)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {areas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedAreas.includes(area.id)
                        ? 'border-blue bg-blue/10 text-blue'
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
              className="flex-1 px-6 py-3 bg-cream text-navy border-2 border-navy/20 rounded-lg hover:bg-navy hover:text-white font-medium transition-all hover:scale-105"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue to-navy text-white hover:shadow-lg hover:shadow-blue/30 hover:scale-105'
              }`}
            >
              {isSubmitting ? 'Wird erstellt...' : 'Aufgabe erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
