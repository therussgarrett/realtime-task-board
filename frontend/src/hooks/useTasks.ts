import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'to-do' | 'in-progress' | 'done';
  board: string;
  position: number;
  assignee?: { _id: string; email: string };
  updatedAt: string;
}

export const useTasks = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { socket } = useSocket();

  const fetchTasks = useCallback(async () => {
    try {
      if (!boardId || !token) {
        setError('Missing board or token');
        setLoading(false);
        return;
      }
      setError(null);
      setLoading(true);

      const res = await fetch(`/api/tasks/board/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      setError(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [boardId, token]);


  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    status?: 'to-do' | 'in-progress' | 'done';
    position?: number;
  }) => {
    try {
      if (!boardId || !token) throw new Error('Missing boardId or token');

      setError(null);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...taskData, boardId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const data = await res.json();



      return data.task;
    } catch (error: any) {
      console.error('Failed to create task:', error);
      setError(error.message || 'Failed to create task');
      throw error;
    }
  }, [boardId, token, socket]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      if (!token) throw new Error('Missing token');

      setError(null);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const data = await res.json();
      setTasks(prev =>
        prev.map(task =>
          task._id === taskId ? data.task : task
        )
      );

      return data.task;
    } catch (error: any) {
      console.error('Failed to update task:', error);
      setError(error.message || 'Failed to update task');
      throw error;
    }
  }, [token]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      setError(null);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Delete failed');
      }


    } catch (error: any) {
      console.error('Delete failed:', error);
      setError(error.message || 'Delete failed');
      throw error;
    }
  }, [token, socket, boardId]);

  useEffect(() => {
    if (boardId && token) {
      fetchTasks();
    }
  }, [boardId, token, fetchTasks]);

  useEffect(() => {
    if (!socket || !boardId) return;

    console.log('🔗 Listening for task-updated on board:', boardId);

    const handleTaskUpdate = (data: { boardId: string; task: Task }) => {

      console.log('TASK RECEIVED:', data.task?._id, 'for board:', data.boardId);

      if (data.boardId === boardId && data.task?._id) {  // NULL CHECKS

        setTasks(prev => {
          const index = prev.findIndex(t => t._id === data.task!._id);;
          if (index > -1) {
            const updated = [...prev];
            updated[index] = data.task;
            return updated;
          }
          return [data.task, ...prev];
        });
      }
    };
    const handleTaskDeleted = (data: { boardId: string; taskId: string }) => {
      console.log('🗑️ Task deleted:', data.taskId);
      if (data.boardId === boardId) {
        setTasks(prev => prev.filter(t => t._id !== data.taskId));
      }
    };
    socket.on('task-updated', handleTaskUpdate);
    socket.on('task-deleted', handleTaskDeleted);
    return () => {
      socket.off('task-updated', handleTaskUpdate);
      socket.off('task-deleted', handleTaskDeleted)
    };
  }, [socket, boardId]);

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask };
};
