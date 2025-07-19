import mongoose, { Schema, Document } from 'mongoose';

export interface IBug extends Document {
  title: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'minor' | 'major' | 'critical' | 'blocker';
  type: 'bug' | 'feature' | 'improvement' | 'task';
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BugSchema = new Schema<IBug>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigneeId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical', 'blocker'],
    default: 'minor'
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'task'],
    default: 'bug'
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  dueDate: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
BugSchema.index({ organizationId: 1 });
BugSchema.index({ projectId: 1 });
BugSchema.index({ reporterId: 1 });
BugSchema.index({ assigneeId: 1 });
BugSchema.index({ status: 1 });
BugSchema.index({ priority: 1 });

export const Bug = mongoose.model<IBug>('Bug', BugSchema);
