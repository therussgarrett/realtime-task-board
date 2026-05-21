import { Response } from 'express';
import Task from '../models/Task';
import Board from '../models/Board';
import { AuthRequest } from '../middleware/requireAuth';

interface CreateTaskBody {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  boardId: string;
  position?: number;
}

export const getTasksByBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;

    const board = await Board.findOne({
      _id: boardId,
      owner: req.user!.userId,
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'email')
      .sort({ position: 1, updatedAt: -1 });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, boardId, position }: CreateTaskBody = req.body;

    const board = await Board.findOne({
      _id: boardId,
      owner: req.user!.userId,
    });

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
      assignee: req.user!.userId,
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'email')
      .populate('board', 'name');

    if (global.io) {
      global.io.to(`board:${boardId}`).emit('task-updated', {
        boardId,
        task: populatedTask,
      });
    }

    res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { title, description, status, position } = req.body;

    const userBoardIds = await Board.distinct('_id', {
      owner: req.user!.userId,
    });

    const task = await Task.findOne({
      _id: taskId,
      board: { $in: userBoardIds },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (position !== undefined) task.position = position;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'email')
      .populate('board', 'name');

    if (global.io) {
      global.io.to(`board:${task.board!.toString()}`).emit('task-updated', {
        boardId: task.board!.toString(),
        task: populatedTask,
      });
    }

    res.json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ error: 'Missing taskId' });
      return;
    }

    const task = await Task.findById(taskId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const board = await Board.findOne({
      _id: task.board,
      owner: req.user!.userId,
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