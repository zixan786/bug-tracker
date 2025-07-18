import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { Plan } from './Plan';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  TRIALING = 'trialing'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ length: 255, nullable: true })
  stripeCustomerId?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  currentPeriodStart?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEnd?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, organization => organization.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // Helper methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.isTrialing();
  }

  isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIALING && 
           this.trialEnd && 
           new Date() < this.trialEnd;
  }

  isPastDue(): boolean {
    return this.status === SubscriptionStatus.PAST_DUE;
  }

  isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  daysUntilExpiry(): number {
    if (!this.currentPeriodEnd) return 0;
    const now = new Date();
    const expiry = new Date(this.currentPeriodEnd);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(days: number = 7): boolean {
    const daysLeft = this.daysUntilExpiry();
    return daysLeft > 0 && daysLeft <= days;
  }
}
