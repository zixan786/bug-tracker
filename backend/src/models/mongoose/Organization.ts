import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  ownerId: mongoose.Types.ObjectId;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt?: Date;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isActive: boolean;
  isTrialExpired: boolean;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'past_due', 'canceled', 'unpaid'],
    default: 'trial'
  },
  trialEndsAt: {
    type: Date
  },
  settings: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Virtual for isActive
OrganizationSchema.virtual('isActive').get(function() {
  return this.subscriptionStatus === 'active' || 
         (this.subscriptionStatus === 'trial' && !this.isTrialExpired);
});

// Virtual for isTrialExpired
OrganizationSchema.virtual('isTrialExpired').get(function() {
  return this.trialEndsAt ? new Date() > this.trialEndsAt : false;
});

// Ensure virtual fields are serialized
OrganizationSchema.set('toJSON', {
  virtuals: true
});

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
