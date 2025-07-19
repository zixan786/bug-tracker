import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private';
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  settings: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for organization queries
ProjectSchema.index({ organizationId: 1 });
ProjectSchema.index({ ownerId: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
