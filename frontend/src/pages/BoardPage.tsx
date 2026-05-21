import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTasks, Task } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const BoardPage: React.FC = () => {
  const { boardName } = useParams<{ boardName: string }>();
  const { boardId } = useParams<{ boardId: string }>();
  const { socket } = useSocket();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (socket && boardId) {
      console.log('🏠 Joining board room:', boardId);
      socket.emit('join-board', boardId);
    }
  }, [socket, boardId]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !boardId) return;
    try {
      const maxPosition = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) : 0;
      await createTask({
        title: newTaskTitle,
        position: maxPosition + 1
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {decodeURIComponent(boardName || 'Board')}
          </h1>
          <p className="text-gray-600">{tasks.length} tasks</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/boards')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← All Boards
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Add Task
          </button>
        </div>
      </form>

      <div className="grid grid-cols-3 gap-6">
        {['todo', 'in-progress', 'done'].map(status => (
          <div key={status} className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-semibold capitalize text-gray-900">
                {status.replace('-', ' ')} ({tasks.filter(t => t.status === status).length})
              </h2>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {tasks
                .filter(task => task.status === status)
                .sort((a, b) => a.position - b.position)
                .map(task => (
                  <div key={task._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-lg">{task.title}</h3>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value as Task['status'])}
                        className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    {task.assignee && (
                      <p className="text-xs text-gray-500">@{task.assignee.email}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardPage;