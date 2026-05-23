import mongoose, { Schema, Document } from 'mongoose';
import { IBoard } from './Board';
import { IUser } from './User';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'to-do' | 'in-progress' | 'done';
  board: IBoard['_id'];
  position: number; // For drag/drop ordering
  assignee?: IUser['_id'];
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['to-do', 'in-progress', 'done'],
    default: 'to-do'
  },
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', TaskSchema);
