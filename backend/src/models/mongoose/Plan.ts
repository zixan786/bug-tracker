import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  features: Record<string, any>;
  limits: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>({
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
  description: {
    type: String,
    trim: true
  },
  priceMonthly: {
    type: Number,
    min: 0
  },
  priceYearly: {
    type: Number,
    min: 0
  },
  features: {
    type: Schema.Types.Mixed,
    default: {}
  },
  limits: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
