import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { verifyToken } from './utils/jwt';
import Board from './models/Board';

declare global {
  var io: any;
}
export class App {
  public app: Application;
  public server: http.Server;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    connectDB().catch(console.error);
  }

  private initializeMiddlewares(): void {
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  private initializeRoutes(): void {
    // Auth routes - using require since we're CommonJS
    const authRoutes = require('../src/routes/authRoutes');
    this.app.use('/api/auth', authRoutes);

    const boardRoutes = require('../src/routes/boardRoutes');
    this.app.use('/api/boards', boardRoutes);

    const taskRoutes = require('../src/routes/taskRoutes');
    this.app.use('/api/tasks', taskRoutes);

    // Root API
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({ message: 'Realtime Task Board API v1' });
    });
  }


  private initializeSocketHandlers(): void {
    global.io = this.io;

    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      socket.data.user = decoded;
      next();
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-board', async (boardId: string) => {
        try {
          const board = await Board.findOne({
            _id: boardId,
            owner: socket.data.user.userId,
          });

          if (!board) {
            console.log(`Blocked unauthorized board join: ${boardId}`);
            return;
          }

          socket.join(`board:${boardId}`);

          console.log(
            `User ${socket.data.user.userId} joined board ${boardId}`
          );
        } catch (error) {
          console.error('Join board error:', error);
        }
      });

      socket.on('leave-board', (boardId: string) => {
        socket.leave(`board:${boardId}`);

        console.log(
          `User ${socket.data.user.userId} left board ${boardId}`
        );
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public listen(port: number): void {
    this.server.listen(port, () => {
      console.log(`🚀 Backend server running on http://localhost:${port}`);
    });
  }
}
