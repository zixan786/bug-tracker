import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Subscription } from './Subscription';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMonthly?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceYearly?: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  limits: {
    maxUsers?: number;
    maxProjects?: number;
    maxBugs?: number;
    storageMb?: number;
    [key: string]: any;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];

  // Helper methods
  hasFeature(feature: string): boolean {
    return !!this.features[feature];
  }

  getLimit(limitName: string): number {
    const limit = this.limits[limitName];
    return limit === -1 ? Infinity : (limit || 0);
  }

  isUnlimited(limitName: string): boolean {
    return this.limits[limitName] === -1;
  }

  canExceedLimit(limitName: string, currentUsage: number): boolean {
    const limit = this.getLimit(limitName);
    return limit === Infinity || currentUsage < limit;
  }
}
