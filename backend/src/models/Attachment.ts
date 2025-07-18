import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Bug } from "./Bug";
import { User } from "./User";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  filename!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column()
  path!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Bug, (bug) => bug.attachments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bugId" })
  bug!: Bug;

  @Column()
  bugId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploadedById" })
  uploadedBy!: User;

  @Column()
  uploadedById!: number;

  // Computed properties
  get sizeInMB(): number {
    return Number(this.size) / (1024 * 1024);
  }

  get isImage(): boolean {
    return this.mimeType.startsWith("image/");
  }
}
