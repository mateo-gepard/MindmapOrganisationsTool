import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/firebaseStore';
import type { Task } from '../../types';

export const CalendarView: React.FC = () => {
  const { tasks, taskDetails } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get all days in the current month view (including padding from prev/next month)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday of the week containing the 1st
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startDate.setDate(firstDay.getDate() - diff);
    
    // Calculate weeks needed
    const daysInMonth = lastDay.getDate();
    const totalDays = diff + daysInMonth;
    const weeksNeeded = Math.ceil(totalDays / 7);
    
    // Generate all days
    const days: Date[] = [];
    for (let i = 0; i < weeksNeeded * 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  }, [currentDate]);
  
  const currentMonth = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get tasks with deadlines for a specific day
  const getTasksForDay = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get milestones for a specific day
  const getMilestonesForDay = (date: Date) => {
    const milestones: Array<{ taskTitle: string; milestoneTitle: string }> = [];
    
    tasks.forEach((task) => {
      const detail = taskDetails.get(task.id);
      if (detail) {
        detail.milestones.forEach((milestone) => {
          if (!milestone.targetDate) return;
          const milestoneDate = new Date(milestone.targetDate);
          if (
            milestoneDate.getDate() === date.getDate() &&
            milestoneDate.getMonth() === date.getMonth() &&
            milestoneDate.getFullYear() === date.getFullYear()
          ) {
            milestones.push({
              taskTitle: task.title,
              milestoneTitle: milestone.title,
            });
          }
        });
      }
    });

    return milestones;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-gray-50">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{currentMonth}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Vorheriger Monat
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Heute
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Nächster Monat →
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const tasksForDay = getTasksForDay(day);
            const milestonesForDay = getMilestonesForDay(day);
            const isTodayDay = isToday(day);
            const inCurrentMonth = isCurrentMonth(day);
            const totalItems = tasksForDay.length + milestonesForDay.length;

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded border p-2 min-h-[100px] ${
                  isTodayDay
                    ? 'border-2 border-blue-500 shadow-md'
                    : inCurrentMonth
                    ? 'border-gray-300'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div
                    className={`text-sm font-semibold ${
                      isTodayDay
                        ? 'text-blue-600'
                        : inCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {totalItems > 0 && (
                    <div className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                      {totalItems}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {/* Deadlines */}
                  {tasksForDay.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-[10px] p-1.5 rounded border-l-2 ${getPriorityColor(task.priority)}`}
                    >
                      <div className="font-medium line-clamp-1">{task.title}</div>
                    </div>
                  ))}

                  {/* Milestones */}
                  {milestonesForDay.slice(0, 3 - tasksForDay.length).map((milestone, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] p-1.5 rounded bg-purple-50 border-l-2 border-purple-500"
                    >
                      <div className="font-medium text-purple-900 line-clamp-1">
                        🏁 {milestone.milestoneTitle}
                      </div>
                    </div>
                  ))}

                  {totalItems > 3 && (
                    <div className="text-[9px] text-gray-500 italic px-1.5">
                      +{totalItems - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Monatsübersicht</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Deadlines: </span>
              <span className="font-semibold">
                {monthDays.filter(isCurrentMonth).reduce((sum, day) => sum + getTasksForDay(day).length, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Meilensteine: </span>
              <span className="font-semibold">
                {monthDays.filter(isCurrentMonth).reduce((sum, day) => sum + getMilestonesForDay(day).length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
