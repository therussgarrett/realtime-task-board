import { Request, Response } from 'express';
import Board, { IBoard } from '../models/Board';
import { verifyToken } from '../utils/jwt';

declare global {
  var io: any;
}

export const getBoards = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const boards = await Board.find({ owner: decoded.userId })
      .populate('owner', 'email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      boards
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { boardId } = req.params;

    if (!token || !boardId) {
      res.status(400).json({ error: 'Missing token or boardId' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const board = await Board.findOne({
      _id: boardId,
      owner: decoded.userId,
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

export const createBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { name } = req.body;

    if (!token || !name) {
      res.status(400).json({ error: 'Token and name required' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const board = new Board({
      name,
      owner: decoded.userId
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

export const deleteBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { boardId } = req.params;

    if (!token || !boardId) {
      res.status(400).json({ error: 'Missing token or boardId' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const board = await Board.findOneAndDelete({
      _id: boardId,
      owner: decoded.userId
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

export const updateBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { boardId } = req.params;
    const { name } = req.body;

    if (!token || !boardId || !name) {
      res.status(400).json({ error: 'Missing token, boardId or name' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const board = await Board.findOneAndUpdate(
      { _id: boardId, owner: decoded.userId },
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
