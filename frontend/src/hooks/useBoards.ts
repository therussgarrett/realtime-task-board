import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiUrl } from '../config/api';

export interface Board {
  _id: string;
  name: string;
  owner: { _id: string; email: string };
  tasks: string[];
  updatedAt: string;
}

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { socket } = useSocket();

  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(apiUrl('/api/boards'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch boards');

      const data = await res.json();
      setBoards(data.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      setError('Failed to load boards. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createBoard = async (name: string) => {
    try {
      const res = await fetch(apiUrl('/api/boards'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();

      if (socket) {
        console.log('📤 EMITTING board-updated:', data);
        socket.emit('board-updated', {
          boardId: data.board._id,
          board: data.board
        });
      }

      return data.board;
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  };
  const deleteBoard = useCallback(async (boardId: string) => {
    if (!confirm(`Delete "${boards.find(b => b._id === boardId)?.name}"?`)) return;

    try {
      const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');

      if (socket) {
        console.log('🗑️ Emitting board-deleted:', boardId);
        socket.emit('board-deleted', boardId);
      }
    } catch (error: any) {
      console.error('Delete board failed:', error);
      alert(error.message);
    }
  }, [token, socket, boards]);

  const renameBoard = useCallback(async (boardId: string, newName: string) => {
    try {
      const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Rename failed');
      }

      const data = await res.json();
      if (socket) {
        socket.emit('board-updated', data.board);
      }
      return data.board;
    } catch (error: any) {
      console.error('Rename failed:', error);
      throw error;
    }
  }, [token, socket]);

  useEffect(() => {
    if (token) {
      fetchBoards();
    }
  }, [token, fetchBoards]);

  useEffect(() => {
    if (!socket) return;

    console.log('🔗 Boards socket listening...'); // DEBUG

    const handleBoardChange = (board: Board) => {
      console.log('📨 BOARD CHANGED:', board._id, board.name);
      setBoards(prev => {
        const index = prev.findIndex(b => b._id === board._id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = board;
          return updated;
        }
        return [board, ...prev];
      });
    };
    const handleBoardDeleted = (deletedId: string) => {
      console.log('🗑️ Board deleted:', deletedId);
      setBoards(prev => prev.filter(b => b._id !== deletedId));
    };

    const handleBoardUpdated = (updatedBoard: Board) => {
      console.log('✏️ Board renamed:', updatedBoard._id);
      setBoards(prev =>
        prev.map(b => b._id === updatedBoard._id ? updatedBoard : b)
      );
    };

    socket.on('board-changed', handleBoardChange);
    socket.on('board-deleted', handleBoardDeleted);
    socket.on('board-updated', handleBoardUpdated);

    return () => {
      socket.off('board-deleted', handleBoardDeleted);
      socket.off('board-updated', handleBoardUpdated);
      socket.off('board-changed', handleBoardChange);
    };
  }, [socket]);


  return { boards, loading, error, fetchBoards, createBoard, deleteBoard, renameBoard };
};
