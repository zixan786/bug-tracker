import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrganizationMember } from './OrganizationMember';
import { Project } from './Project';
import { Bug } from './Bug';
import { Subscription } from './Subscription';

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid'
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  domain?: string;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndsAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => OrganizationMember, member => member.organization)
  members: OrganizationMember[];

  @OneToMany(() => Project, project => project.organization)
  projects: Project[];

  @OneToMany(() => Bug, bug => bug.organization)
  bugs: Bug[];

  @OneToMany(() => Subscription, subscription => subscription.organization)
  subscriptions: Subscription[];

  // Virtual properties
  get isTrialExpired(): boolean {
    return this.trialEndsAt ? new Date() > this.trialEndsAt : false;
  }

  get isActive(): boolean {
    return this.subscriptionStatus === SubscriptionStatus.ACTIVE || 
           (this.subscriptionStatus === SubscriptionStatus.TRIAL && !this.isTrialExpired);
  }
}
