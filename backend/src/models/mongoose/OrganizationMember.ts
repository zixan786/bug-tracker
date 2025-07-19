import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationMember extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isAdmin(): boolean;
  canManageMembers(): boolean;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedAt: {
    type: Date
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique user per organization
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

// Methods
OrganizationMemberSchema.methods.isAdmin = function(): boolean {
  return this.role === 'owner' || this.role === 'admin';
};

OrganizationMemberSchema.methods.canManageMembers = function(): boolean {
  return this.role === 'owner' || this.role === 'admin';
};

export const OrganizationMember = mongoose.model<IOrganizationMember>('OrganizationMember', OrganizationMemberSchema);
