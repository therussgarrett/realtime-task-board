import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBoards } from '../hooks/useBoards';
import { useAuth } from '../context/AuthContext';

const BoardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { boards, loading, error, createBoard, renameBoard, deleteBoard } = useBoards();
  const { logout } = useAuth();

  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      await createBoard(newBoardName);
      setNewBoardName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (boardId: string, name: string) => {
    setEditingBoardId(boardId);
    setEditName(name);
  };


  const saveRename = async () => {
    if (!editingBoardId || !editName.trim()) return;
    try {
      await renameBoard(editingBoardId, editName);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading boards...</div>;
  if (error) return (
    <div className="p-8 text-center text-red-600">
      {error} <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Boards</h1>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">
          Logout
        </button>
      </div>

      <form onSubmit={handleCreate} className="mb-8 p-4 border rounded bg-white">
        <div className="flex gap-2">
          <input
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            placeholder="New board name..."
            className="flex-1 p-3 border rounded focus:ring-2"
          />
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded">
            Create
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {boards.map(board => (
          <div
            key={board._id}
            className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all group"
            onClick={() => {
              console.log('🚀 Navigating to:', `/boards/${board._id}`);  // DEBUG
              navigate(`/boards/${board._id}`);
            }}
          >
            {editingBoardId === board._id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={saveRename}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter') saveRename();
                  if (e.key === 'Escape') setEditingBoardId(null);
                }}
                className="flex-1 p-2 border rounded focus:ring-2"
              />
            ) : (
              <h3 className="flex-1 font-semibold text-xl">
                {board.name}
              </h3>
            )}

            {editingBoardId !== board._id && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    startEdit(board._id, board.name);
                  }}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  ✏️
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteBoard(board._id);
                  }}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        ))}


      </div>

      {boards.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          No boards yet. Create one above!
        </div>
      )}
    </div>
  );
};

export default BoardsPage;
