import React from 'react';
import type { Task, Priority } from '../../types';

interface PinProps {
  task: Task;
}

// Get task type color
function getTypeColor(type: string): string {
  switch (type) {
    case 'repetitive':
      return 'bg-navy'; // #003049
    case 'one-time':
      return 'bg-blue'; // #669bbc
    case 'large':
      return 'bg-crimson'; // #c1121f
    default:
      return 'bg-navy';
  }
}

// Get priority border style
function getPriorityBorder(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'ring-4 ring-orange ring-offset-2'; // #780000
    case 'medium':
      return 'ring-2 ring-crimson ring-offset-1'; // #c1121f
    case 'low':
      return 'ring-1 ring-blue'; // #669bbc
  }
}

// Get size classes by priority (larger for higher priority)
function getSizeForPriority(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'w-9 h-9';
    case 'medium':
      return 'w-7 h-7';
    case 'low':
      return 'w-5 h-5';
    default:
      return 'w-5 h-5';
  }
}

// Unified pin component - small, simple circle with permanent label
export const TaskPin: React.FC<PinProps> = ({ task }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);
    
    // Listen to parent drag events
    const element = document.querySelector(`[data-id="${task.id}"]`);
    if (element) {
      element.addEventListener('mousedown', handleDragStart);
      element.addEventListener('mouseup', handleDragEnd);
      element.addEventListener('touchstart', handleDragStart);
      element.addEventListener('touchend', handleDragEnd);
      
      return () => {
        element.removeEventListener('mousedown', handleDragStart);
        element.removeEventListener('mouseup', handleDragEnd);
        element.removeEventListener('touchstart', handleDragStart);
        element.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [task.id]);

  return (
    <div 
      className="flex flex-col items-center cursor-grab active:cursor-grabbing group select-none" 
      style={{ 
        transform: 'translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {/* Small circle pin */}
      <div className="relative">
        <div
          className={`${getSizeForPriority(task.priority)} rounded-full ${getTypeColor(
            task.type
          )} ${getPriorityBorder(task.priority)} shadow-md ${
            isDragging 
              ? 'scale-125 shadow-2xl' 
              : 'group-hover:scale-110 group-hover:shadow-lg transition-transform duration-200 ease-out'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)',
            willChange: isDragging ? 'transform' : 'auto',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      
      {/* Always visible compact label */}
      <div 
        className={`mt-1.5 text-[9px] leading-tight text-center font-medium text-orange line-clamp-2 px-0.5 max-w-[90px] ${
          isDragging ? 'opacity-50' : 'opacity-100 transition-opacity duration-150'
        }`}
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          willChange: isDragging ? 'opacity' : 'auto'
        }}
      >
        {task.title}
      </div>
    </div>
  );
};
