import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Project } from "./Project";
import { Comment } from "./Comment";
import { Attachment } from "./Attachment";

export enum BugStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CODE_REVIEW = "code_review",
  QA_TESTING = "qa_testing",
  RESOLVED = "resolved",
  CLOSED = "closed",
  REOPENED = "reopened",
  REJECTED = "rejected",
}

export enum BugPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum BugSeverity {
  MINOR = "minor",
  MAJOR = "major",
  CRITICAL = "critical",
  BLOCKER = "blocker",
}

export enum BugType {
  BUG = "bug",
  FEATURE = "feature",
  IMPROVEMENT = "improvement",
  TASK = "task",
}

@Entity("bugs")
export class Bug {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "text",
    default: BugStatus.OPEN,
  })
  status!: BugStatus;

  @Column({
    type: "text",
    default: BugPriority.MEDIUM,
  })
  priority!: BugPriority;

  @Column({
    type: "text",
    default: BugSeverity.MINOR,
  })
  severity!: BugSeverity;

  @Column({
    type: "text",
    default: BugType.BUG,
  })
  type!: BugType;

  @Column({ type: "text", nullable: true })
  stepsToReproduce!: string;

  @Column({ type: "text", nullable: true })
  expectedBehavior!: string;

  @Column({ type: "text", nullable: true })
  actualBehavior!: string;

  @Column({ nullable: true })
  environment!: string;

  @Column({ nullable: true })
  browserVersion!: string;

  @Column({ nullable: true })
  operatingSystem!: string;

  @Column({ type: "date", nullable: true })
  dueDate!: Date;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  estimatedHours!: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  actualHours!: number;

  @Column({ type: "text", nullable: true })
  tags!: string; // JSON string of tags

  @Column({ type: "text", nullable: true })
  resolution!: string; // Resolution notes

  @Column({ type: "date", nullable: true })
  resolvedAt!: Date;

  @Column({ type: "date", nullable: true })
  closedAt!: Date;

  @Column({ nullable: true })
  qaAssigneeId!: number; // Separate QA assignee

  @Column({ type: "text", nullable: true })
  testSteps!: string; // QA test steps

  @Column({ type: "text", nullable: true })
  acceptanceCriteria!: string; // Acceptance criteria

  @Column({ default: false })
  isBlocking!: boolean; // Is this bug blocking other work

  @Column({ nullable: true })
  blockedByBugId!: number; // Reference to blocking bug

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.bugs)
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column()
  projectId!: number;

  @ManyToOne(() => User, (user) => user.reportedBugs)
  @JoinColumn({ name: "reporterId" })
  reporter!: User;

  @Column()
  reporterId!: number;

  @ManyToOne(() => User, (user) => user.assignedBugs, { nullable: true })
  @JoinColumn({ name: "assigneeId" })
  assignee!: User;

  @Column({ nullable: true })
  assigneeId!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "qaAssigneeId" })
  qaAssignee!: User;

  @ManyToOne(() => Bug, { nullable: true })
  @JoinColumn({ name: "blockedByBugId" })
  blockedByBug!: Bug;

  @OneToMany(() => Bug, (bug) => bug.blockedByBug)
  blockingBugs!: Bug[];

  @OneToMany(() => Comment, (comment) => comment.bug)
  comments!: Comment[];

  @OneToMany(() => Attachment, (attachment) => attachment.bug)
  attachments!: Attachment[];

  // Computed properties
  get isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate : false;
  }

  get commentsCount(): number {
    return this.comments?.length || 0;
  }

  get attachmentsCount(): number {
    return this.attachments?.length || 0;
  }
}
