import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Bug } from "./Bug";

export enum BugHistoryAction {
  CREATED = "created",
  STATUS_CHANGED = "status_changed",
  ASSIGNED = "assigned",
  PRIORITY_CHANGED = "priority_changed",
  SEVERITY_CHANGED = "severity_changed",
  COMMENTED = "commented",
  ATTACHMENT_ADDED = "attachment_added",
  RESOLVED = "resolved",
  CLOSED = "closed",
  REOPENED = "reopened",
  QA_ASSIGNED = "qa_assigned",
  CODE_REVIEW_REQUESTED = "code_review_requested",
  BLOCKED = "blocked",
  UNBLOCKED = "unblocked",
}

@Entity("bug_history")
export class BugHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "text",
  })
  action!: BugHistoryAction;

  @Column({ type: "text", nullable: true })
  oldValue!: string;

  @Column({ type: "text", nullable: true })
  newValue!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "text", nullable: true })
  metadata!: string; // JSON string for additional data

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Bug, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bugId" })
  bug!: Bug;

  @Column()
  bugId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: number;

  // Computed properties
  get formattedDescription(): string {
    switch (this.action) {
      case BugHistoryAction.CREATED:
        return "Bug was created";
      case BugHistoryAction.STATUS_CHANGED:
        return `Status changed from ${this.oldValue} to ${this.newValue}`;
      case BugHistoryAction.ASSIGNED:
        return `Bug assigned to ${this.newValue}`;
      case BugHistoryAction.PRIORITY_CHANGED:
        return `Priority changed from ${this.oldValue} to ${this.newValue}`;
      case BugHistoryAction.SEVERITY_CHANGED:
        return `Severity changed from ${this.oldValue} to ${this.newValue}`;
      case BugHistoryAction.COMMENTED:
        return "Comment added";
      case BugHistoryAction.ATTACHMENT_ADDED:
        return "Attachment added";
      case BugHistoryAction.RESOLVED:
        return "Bug marked as resolved";
      case BugHistoryAction.CLOSED:
        return "Bug closed";
      case BugHistoryAction.REOPENED:
        return "Bug reopened";
      case BugHistoryAction.QA_ASSIGNED:
        return `QA assigned to ${this.newValue}`;
      case BugHistoryAction.CODE_REVIEW_REQUESTED:
        return "Code review requested";
      case BugHistoryAction.BLOCKED:
        return `Bug blocked by ${this.newValue}`;
      case BugHistoryAction.UNBLOCKED:
        return "Bug unblocked";
      default:
        return this.description || "Action performed";
    }
  }
}
