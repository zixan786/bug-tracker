import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

@Entity('organization_members')
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'varchar',
    default: OrganizationRole.MEMBER
  })
  role: OrganizationRole;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, any>;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  invitedAt?: Date;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE
  })
  status: MemberStatus;

  // Relations
  @ManyToOne(() => Organization, organization => organization.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;

  // Helper methods
  isOwner(): boolean {
    return this.role === OrganizationRole.OWNER;
  }

  isAdmin(): boolean {
    return this.role === OrganizationRole.ADMIN || this.isOwner();
  }

  canManageMembers(): boolean {
    return this.isAdmin();
  }

  canManageProjects(): boolean {
    return this.isAdmin() || this.role === OrganizationRole.MEMBER;
  }

  canManageBugs(): boolean {
    return this.role !== OrganizationRole.VIEWER;
  }
}
