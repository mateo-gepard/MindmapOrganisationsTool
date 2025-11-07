import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../../stores/firebaseStore';
import { TaskEditModal } from '../modals/TaskEditModal';
import { ProjectDetailModal } from '../modals/ProjectDetailModal';
import { AddTaskModal } from '../modals/AddTaskModal';
import { getAreasForPosition } from '../../utils/geometry';
import type { Task, AreaId } from '../../types';

export const D3MapView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    tasks, 
    areas, 
    updateTask, 
    isDailyPlanningMode, 
    setDailyPlanningMode, 
    addToDailyTodos,
    dailyTodos,
    removeFromDailyTodos,
    clearDailyTodos,
    toggleTaskComplete,
    setCurrentView,
  } = useAppStore();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projectDetailTask, setProjectDetailTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group with zoom behavior
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial zoom to center
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    // Draw areas as circles
    const areaGroups = g.selectAll('.area')
      .data(areas)
      .enter()
      .append('g')
      .attr('class', 'area')
      .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`);

    // Area circles
    areaGroups.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.id === 'leisure' ? `${d.color}05` : `${d.color}12`)
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.id === 'leisure' ? 3 : 2)
      .attr('stroke-opacity', d => d.id === 'leisure' ? 0.3 : 0.6);

    // Area labels
    areaGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => d.id === 'leisure' ? '16px' : '14px')
      .attr('font-weight', '600')
      .attr('fill', '#6b7280')
      .text(d => d.name);

    // Draw tasks as nodes with drag behavior
    const taskGroups = g.selectAll('.task')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task')
      .attr('transform', d => {
        const pos = d.position || { x: width / 2, y: height / 2 };
        return `translate(${pos.x}, ${pos.y})`;
      })
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, Task>()
        .on('start', function() {
          d3.select(this).raise();
        })
        .on('drag', function(event) {
          const x = event.x;
          const y = event.y;
          d3.select(this).attr('transform', `translate(${x}, ${y})`);
        })
        .on('end', function(event, d) {
          const x = event.x;
          const y = event.y;
          
          // Update position
          const position = { x, y };
          const newAreas = getAreasForPosition({ x: x + 30, y: y + 30 }, areas);

          if (newAreas.length > 0) {
            updateTask(d.id, {
              position,
              areas: newAreas as AreaId[],
              isHybrid: newAreas.length > 1,
            });
          }
        })
      )
      .on('click', function(event, d) {
        event.stopPropagation();
        if (isDailyPlanningMode) {
          addToDailyTodos(d.id);
        } else {
          setSelectedTask(d);
        }
      });

    // Task circles with gradient backgrounds
    taskGroups.append('circle')
      .attr('r', 30)
      .attr('fill', d => {
        if (d.completedAt) return '#d1d5db';
        switch (d.priority) {
          case 'high': return '#c1121f';
          case 'medium': return '#669bbc';
          case 'low': return '#003049';
          default: return '#669bbc';
        }
      })
      .attr('opacity', d => d.completedAt ? 0.5 : 0.9)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');

    // Task type icon
    taskGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '20px')
      .attr('fill', '#fff')
      .text(d => {
        if (d.completedAt) return '✓';
        switch (d.type) {
          case 'repetitive': return '⟳';
          case 'one-time': return '□';
          case 'large': return '△';
          default: return '●';
        }
      });

    // Task title on hover
    taskGroups.append('title')
      .text(d => d.title);

    // Background grid pattern
    const defs = svg.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', '#f3f4f6');

    pattern.append('path')
      .attr('d', 'M 20 0 L 0 0 0 20')
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 0.5);

    // Add grid background
    svg.insert('rect', ':first-child')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#grid)');

  }, [tasks, areas, updateTask, isDailyPlanningMode, addToDailyTodos]);

  return (
    <div className="w-full h-full relative bg-gray-100">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ userSelect: 'none' }}
      />

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl p-6 max-h-[calc(100vh-2rem)] overflow-y-auto z-50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{selectedTask.title}</h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Typ:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">{selectedTask.type}</span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">Priorität:</span>
              <span className="ml-2 text-sm text-gray-900 capitalize">{selectedTask.priority}</span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">Bereiche:</span>
              <div className="flex gap-2 mt-1">
                {selectedTask.areas.map((areaId) => (
                  <span
                    key={areaId}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
                  >
                    {areas.find((a) => a.id === areaId)?.name}
                  </span>
                ))}
              </div>
            </div>

            {selectedTask.dueDate && (
              <div>
                <span className="text-sm font-medium text-gray-600">Fällig:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(selectedTask.dueDate).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}

            {selectedTask.completedAt && (
              <div>
                <span className="text-sm font-medium text-gray-600">Erledigt am:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(selectedTask.completedAt).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setEditingTask(selectedTask);
                  setSelectedTask(null);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue to-navy text-white rounded-lg hover:shadow-lg hover:shadow-blue/30 font-medium transition-all hover:scale-105"
              >
                Bearbeiten
              </button>
              
              {selectedTask.type === 'large' && (
                <button
                  onClick={() => {
                    setProjectDetailTask(selectedTask);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-crimson to-orange text-white rounded-lg hover:shadow-lg hover:shadow-crimson/30 font-medium transition-all hover:scale-105"
                >
                  Details →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Project Detail Modal */}
      {projectDetailTask && (
        <ProjectDetailModal
          task={projectDetailTask}
          onClose={() => setProjectDetailTask(null)}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Daily To-Do Sidebar */}
      {dailyTodos.length > 0 && (
        <div className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue/30 p-5 max-h-[calc(100vh-2rem)] overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue to-navy bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-xl">✨</span>
              Daily To-Do
            </h3>
            <button
              onClick={clearDailyTodos}
              className="text-navy/60 hover:text-red-600 text-sm font-medium transition-colors"
            >
              Alle löschen
            </button>
          </div>

          <div className="space-y-2.5">
            {dailyTodos.map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              if (!task) return null;

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border-l-4 transition-all hover:shadow-md ${
                    task.priority === 'high'
                      ? 'border-navy bg-gradient-to-r from-cream to-crimson/20'
                      : task.priority === 'medium'
                      ? 'border-crimson bg-gradient-to-r from-cream/80 to-blue/20'
                      : 'border-blue bg-gradient-to-r from-blue/20 to-cream/50'
                  } ${task.completedAt ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 mt-0.5 transition-all ${
                        task.completedAt
                          ? 'bg-gradient-to-br from-blue to-navy border-blue shadow-lg shadow-blue/30'
                          : 'border-navy/30 hover:border-blue hover:shadow-md'
                      }`}
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
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          task.completedAt
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {task.type === 'repetitive' && '⟳'}
                        {task.type === 'one-time' && '□'}
                        {task.type === 'large' && '△'}
                        {' '}{task.priority}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromDailyTodos(task.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setCurrentView('daily');
              setDailyPlanningMode(false);
            }}
            className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue to-navy text-white rounded-xl hover:shadow-lg hover:shadow-blue/30 text-sm font-semibold transition-all hover:scale-105"
          >
            Zur Daily View →
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <div
        className="fixed bottom-8 right-8 flex flex-col-reverse items-end gap-3 z-50"
        onMouseEnter={() => setFabExpanded(true)}
        onMouseLeave={() => setFabExpanded(false)}
      >
        <button
          className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center text-3xl transition-all duration-300 ${
            fabExpanded
              ? 'bg-gradient-to-br from-navy to-orange text-white rotate-45 shadow-navy/50'
              : isDailyPlanningMode
              ? 'bg-gradient-to-br from-blue to-navy text-white shadow-blue/50 hover:scale-110'
              : 'bg-gradient-to-br from-navy to-orange text-white shadow-navy/50 hover:scale-110'
          }`}
        >
          {fabExpanded ? '×' : isDailyPlanningMode ? '✨' : '⚡'}
        </button>

        <div
          className={`transition-all duration-300 ${
            fabExpanded
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={() => {
              setShowAddModal(true);
              setFabExpanded(false);
            }}
            className="w-14 h-14 bg-gradient-to-br from-blue to-navy/80 text-white rounded-2xl shadow-lg shadow-blue/40 hover:shadow-xl hover:shadow-blue/50 hover:scale-110 flex items-center justify-center text-2xl transition-all"
            title="Neue Aufgabe erstellen"
          >
            +
          </button>
        </div>

        <div
          className={`transition-all duration-300 ${
            fabExpanded
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={() => {
              setDailyPlanningMode(!isDailyPlanningMode);
              setFabExpanded(false);
            }}
            className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 ${
              isDailyPlanningMode
                ? 'bg-gradient-to-br from-blue to-navy text-white shadow-blue/40 hover:shadow-xl hover:shadow-blue/50'
                : 'bg-cream text-blue hover:bg-blue hover:text-white border-2 border-blue shadow-blue/20'
            }`}
            title={
              isDailyPlanningMode
                ? 'Planungsmodus beenden'
                : 'Planungsmodus aktivieren'
            }
          >
            ✨
          </button>
        </div>
      </div>

      {/* Planning Mode Indicator */}
      {isDailyPlanningMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue to-navy text-white px-6 py-3 rounded-full shadow-xl shadow-blue/30 flex items-center gap-3 z-50 animate-pulse">
          <span className="text-lg">✨</span>
          <span className="font-semibold">Planungsmodus aktiv - Klicke Tasks an</span>
          <button
            onClick={() => setDailyPlanningMode(false)}
            className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-medium transition-all"
          >
            Beenden
          </button>
        </div>
      )}
    </div>
  );
};
