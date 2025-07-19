import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
    default: 'trialing'
  },
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripeCustomerId: {
    type: String
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  canceledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for organization queries
SubscriptionSchema.index({ organizationId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
