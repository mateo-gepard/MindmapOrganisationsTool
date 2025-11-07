import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Node, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { useAppStore } from '../../stores/firebaseStore';
import { TaskPin } from '../pins/TaskPin';
import { TaskEditModal } from '../modals/TaskEditModal';
import { ProjectDetailModal } from '../modals/ProjectDetailModal';
import { AddTaskModal } from '../modals/AddTaskModal';
import { getAreasForPosition } from '../../utils/geometry';
import type { Task, AreaId } from '../../types';

// Custom node for area circles
const AreaNode = ({ data }: { data: any }) => {
  const isLeisure = data.id === 'leisure';
  
  return (
    <div
      className={`rounded-full border-3 flex items-center justify-center ${
        isLeisure ? 'border-opacity-30' : 'border-opacity-60'
      }`}
      style={{
        width: data.radius * 2,
        height: data.radius * 2,
        borderColor: data.color,
        borderWidth: isLeisure ? '3px' : '2px',
        backgroundColor: isLeisure ? `${data.color}05` : `${data.color}12`,
        borderStyle: 'solid',
      }}
    >
      <span 
        className={`font-semibold ${
          isLeisure ? 'text-base text-gray-500' : 'text-sm text-gray-600'
        }`}
      >
        {data.name}
      </span>
    </div>
  );
};

// Custom node for task pins
const TaskNode = ({ data }: { data: any }) => {
  return <TaskPin task={data.task} />;
};

const nodeTypes: NodeTypes = {
  area: AreaNode,
  task: TaskNode,
};

export const MapView: React.FC = () => {
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
    currentView,
  } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projectDetailTask, setProjectDetailTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  // Create all nodes - memoized to prevent unnecessary recreation
  const allNodes: Node[] = React.useMemo(() => {
    const areaNodes = areas.map((area) => ({
      id: `area-${area.id}`,
      type: 'area',
      position: { x: area.position.x - area.radius, y: area.position.y - area.radius },
      data: { ...area },
      draggable: false,
      selectable: false,
    }));

    const taskNodes = tasks.map((task) => ({
      id: task.id,
      type: 'task',
      position: task.position || { x: 0, y: 0 },
      data: { task },
      draggable: true,
      selectable: true,
      dragHandle: undefined, // Allow dragging from anywhere on the node
    }));

    return [...areaNodes, ...taskNodes];
  }, [areas, tasks]);

  // Initialize nodes and edges with React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  // Update nodes when allNodes changes
  React.useEffect(() => {
    setNodes(allNodes);
  }, [allNodes, setNodes]);

  // Handle node drag - optimized for smooth dragging
  const onNodeDrag = useCallback(
    (_event: any, node: Node) => {
      if (node.type === 'task') {
        // Update node position immediately for ultra-smooth dragging
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, position: node.position }
              : n
          )
        );
      }
    },
    [setNodes]
  );

  // Handle node drag end
  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      if (node.type === 'task') {
        const taskId = node.id;
        const position = {
          x: node.position.x + 30, // Center of small pin
          y: node.position.y + 30,
        };

        // Determine which areas the task is in
        const newAreas = getAreasForPosition(position, areas);

        if (newAreas.length > 0) {
          updateTask(taskId, {
            position: node.position,
            areas: newAreas as AreaId[],
            isHybrid: newAreas.length > 1,
          });
        }
      }
    },
    [areas, updateTask]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_event: any, node: Node) => {
      if (node.type === 'task') {
        if (isDailyPlanningMode) {
          // In planning mode, add to daily todos instead of opening modal
          addToDailyTodos(node.data.task.id);
        } else {
          setSelectedTask(node.data.task);
        }
      }
    },
    [isDailyPlanningMode, addToDailyTodos]
  );

  return (
    <div className="w-full h-full relative bg-gray-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        selectNodesOnDrag={false}
        nodesDraggable={true}
        elementsSelectable={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={true}
        preventScrolling={true}
        nodesFocusable={false}
        edgesFocusable={false}
        autoPanOnNodeDrag={false}
        autoPanOnConnect={false}
        snapGrid={[10, 10]}
        snapToGrid={false}
        translateExtent={[[-2000, -2000], [2000, 2000]]}
        nodeExtent={[[-1500, -1500], [1500, 1500]]}
      >
        <Background color="#d1d5db" gap={20} size={1} />
        <Controls />
      </ReactFlow>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
      {dailyTodos.length > 0 && currentView === 'map' && (
        <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue/30 p-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
              setDailyPlanningMode(false); // Planungsmodus beenden beim Wechsel zur Daily View
            }}
            className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue to-navy text-white rounded-xl hover:shadow-lg hover:shadow-blue/30 text-sm font-semibold transition-all hover:scale-105"
          >
            Zur Daily View →
          </button>
        </div>
      )}

      {/* Floating Action Button - Bottom Right, Expands Upward */}
      <div
        className="fixed bottom-8 right-8 flex flex-col-reverse items-end gap-3"
        onMouseEnter={() => setFabExpanded(true)}
        onMouseLeave={() => setFabExpanded(false)}
      >
        {/* Main FAB - always visible at bottom */}
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

        {/* Add Task Button - appears when expanded (above main button) */}
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

        {/* Planning Mode Button - appears when expanded (above add button) */}
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
                : 'Planungsmodus: Klicke Tasks an, um sie zum Tagesplan hinzuzufügen'
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
