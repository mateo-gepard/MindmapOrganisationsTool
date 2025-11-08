import React from 'react';
import { useAppStore } from '../../stores/firebaseStore';

export const DailyView: React.FC = () => {
  const { tasks, dailyTodos, removeFromDailyTodos, clearDailyTodos, toggleTaskComplete, taskDetails, toggleSubtask } = useAppStore();

  const dailyTasks = tasks.filter((task) => dailyTodos.includes(task.id));
  
  // Count completed tasks
  const completedCount = dailyTasks.filter((task) => task.completedAt).length;
  const totalCount = dailyTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'repetitive':
        return '⟳';
      case 'one-time':
        return '□';
      case 'large':
        return '△';
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-gradient-to-br from-cream via-blue/20 to-cream/30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue to-navy rounded-2xl flex items-center justify-center shadow-lg shadow-blue/30">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue to-navy bg-clip-text text-transparent">
              Tagesplan
            </h1>
          </div>
          <p className="text-navy/70 ml-15">
            {new Date().toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-navy">Fortschritt</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue to-navy bg-clip-text text-transparent">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-cream rounded-full h-5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue via-crimson to-blue h-5 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-navy/70 font-medium">
              {progressPercentage.toFixed(0)}% erledigt
            </span>
            {totalCount > 0 && (
              <button
                onClick={clearDailyTodos}
                className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-all"
              >
                Alle entfernen
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        {totalCount === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue/30 p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-navy mb-2">
              Keine Aufgaben für heute geplant
            </h3>
            <p className="text-navy/70 mb-6">
              Wechsle zur Map-Ansicht und klicke auf den ✨ Button, um Tasks zu deinem
              Tagesplan hinzuzufügen.
            </p>
            <button
              onClick={() => useAppStore.getState().setCurrentView('map')}
              className="px-6 py-3 bg-gradient-to-r from-navy to-orange text-white rounded-xl hover:shadow-lg hover:shadow-navy/30 font-semibold transition-all hover:scale-105"
            >
              Zur Map-Ansicht
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border-l-4 transition-all hover:shadow-xl hover:scale-[1.01] ${
                  task.priority === 'high'
                    ? 'border-navy bg-gradient-to-r from-cream/70 to-crimson/20'
                    : task.priority === 'medium'
                    ? 'border-crimson bg-gradient-to-r from-cream/80 to-blue/20'
                    : 'border-blue bg-gradient-to-r from-blue/20 to-cream/50'
                } ${task.completedAt ? 'opacity-60' : ''} p-4`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskComplete(task.id, true)}
                    className={`flex-shrink-0 w-7 h-7 rounded-xl border-2 transition-all mt-1 ${
                      task.completedAt
                        ? 'bg-gradient-to-br from-blue to-navy border-blue shadow-lg shadow-blue/30'
                        : 'border-navy/30 hover:border-blue hover:shadow-md'
                    }`}
                    title={task.completedAt ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                  >
                    {task.completedAt && (
                      <svg
                        className="w-full h-full text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3
                        className={`text-lg font-semibold ${
                          task.completedAt
                            ? 'line-through text-navy/50'
                            : 'text-navy'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <button
                        onClick={() => removeFromDailyTodos(task.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                        title="Aus Tagesplan entfernen"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {getTypeIcon(task.type)} {task.type}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                        {task.priority} Priorität
                      </span>
                      {task.dueDate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          📅 {new Date(task.dueDate).toLocaleDateString('de-DE')}
                        </span>
                      )}
                      {task.areas.map((areaId) => (
                        <span
                          key={areaId}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700"
                        >
                          {areaId}
                        </span>
                      ))}
                    </div>

                    {/* Subtasks for large projects */}
                    {task.type === 'large' && taskDetails.has(task.id) && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm font-semibold text-navy/70">Teilaufgaben:</div>
                        {taskDetails.get(task.id)?.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSubtask(task.id, subtask.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
                                subtask.done
                                  ? 'bg-gradient-to-br from-blue to-navy border-blue'
                                  : 'border-navy/30 hover:border-blue'
                              }`}
                            >
                              {subtask.done && (
                                <svg
                                  className="w-full h-full text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <span className={`text-sm ${subtask.done ? 'line-through text-navy/50' : 'text-navy'}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {task.completedAt && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Erledigt am {new Date(task.completedAt).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        {totalCount > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue/20 to-cream border-l-4 border-blue p-4 rounded-xl shadow-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h4 className="font-semibold text-navy mb-1">Tipp</h4>
                <p className="text-sm text-navy/70">
                  Konzentriere dich auf die wichtigsten Aufgaben zuerst. Du kannst Tasks
                  jederzeit mit dem ✕ Button aus deinem Tagesplan entfernen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
