import { Request, Response } from 'express';
import Task, { ITask } from '../models/Task';
import Board from '../models/Board';
import { verifyToken } from '../utils/jwt';

interface CreateTaskBody {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  boardId: string;
  position?: number;
}

export const getTasksByBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = verifyToken(token!);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const { boardId } = req.params;

    // Verify user owns board
    const board = await Board.findOne({ _id: boardId, owner: decoded.userId });
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'email')
      .sort({ position: 1, updatedAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = verifyToken(token!);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const { title, description, status, boardId, position }: CreateTaskBody = req.body;

    const board = await Board.findOne({ _id: boardId, owner: decoded.userId });
    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const task = new Task({
      title,
      description,
      status: status || 'todo',
      board: boardId,
      position: position || 0,
      assignee: decoded.userId
    });
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'email')
      .populate('board', 'name');

    (global.io as any).to(`board:${boardId}`).emit('task-updated', {
      boardId,
      task: populatedTask
    });

    res.status(201).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = verifyToken(token!);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findOne({ _id: taskId, board: { $in: await Board.distinct('_id', { owner: decoded.userId }) } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    Object.assign(task, updates);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'email')
      .populate('board', 'name');

    (global.io as any).to(`board:${task.board!.toString()}`).emit('task-updated', {
      boardId: task.board!.toString(),
      task: populatedTask
    });

    res.json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { taskId } = req.params;

    if (!token || !taskId) {
      res.status(400).json({ error: 'Missing token or taskId' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const board = await Board.findOne({
      _id: task.board,
      owner: decoded.userId
    });
    if (!board) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await Task.findByIdAndDelete(taskId);

    if (global.io) {
      global.io.to(`board:${task.board.toString()}`).emit('task-deleted', {
        boardId: task.board.toString(),
        taskId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
