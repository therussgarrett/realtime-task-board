import { Response } from 'express';
import Board from '../models/Board';
import { AuthRequest } from '../middleware/requireAuth';

declare global {
  var io: any;
}

export const getBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boards = await Board.find({ owner: req.user!.userId })
      .populate('owner', 'email')
      .sort({ updatedAt: -1 });

    res.json({ success: true, boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const { boardId } = req.params;

    if (!boardId) {
      res.status(400).json({ error: 'Missing token or boardId' });
      return;
    }


    const board = await Board.findOne({
      _id: boardId,
      owner: req.user!.userId,
    }).populate('owner', 'email');

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    res.json({
      success: true,
      board,
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Token and name required' });
      return;
    }

    const board = new Board({
      name,
      owner: req.user!.userId
    });
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'email');

    if (global.io && populatedBoard) {
      console.log('📡 Broadcasting board-changed:', populatedBoard._id);
      global.io.emit('board-changed', populatedBoard);
    }

    res.status(201).json({
      success: true,
      board: populatedBoard
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      res.status(400).json({ error: 'Missing token or boardId' });
      return;
    }

    const board = await Board.findOneAndDelete({
      _id: boardId,
      owner: req.user!.userId
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (global.io) {
      console.log('🗑️ Broadcasting board-deleted:', boardId);
      global.io.emit('board-deleted', boardId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { name } = req.body;

    if (!boardId || !name) {
      res.status(400).json({ error: 'Missing token, boardId or name' });
      return;
    }


    const board = await Board.findOneAndUpdate(
      { _id: boardId, owner: req.user!.userId },
      { name, updatedAt: new Date() },
      { new: true }
    ).populate('owner', 'email');

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (global.io) {
      console.log('✏️ Broadcasting board-updated:', boardId);
      global.io.emit('board-updated', board);
    }

    res.json({ success: true, board });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
