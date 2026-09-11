import mongoose, { Document, Schema, Model } from 'mongoose';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface ISubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  taskDateTime?: Date; // Scheduled execution date/time
  deadline?: Date;     // Hard completion cutoff deadline
  priority: PriorityLevel;
  status: TaskStatus;
  category?: string;   // e.g. Work, Personal, Study, Health
  tags: string[];      // Multiple labels
  subtasks: ISubtask[]; // Nested checklist
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    taskDateTime: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true, trim: true },
          isCompleted: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's tasks by status and deadline
TaskSchema.index({ userId: 1, status: 1, deadline: 1 });

export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
