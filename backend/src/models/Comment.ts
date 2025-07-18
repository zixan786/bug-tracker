import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Bug } from "./Bug";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  content!: string;

  @Column({ default: false })
  isInternal!: boolean; // Internal comments only visible to team members

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Bug, (bug) => bug.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bugId" })
  bug!: Bug;

  @Column()
  bugId!: number;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column()
  authorId!: number;
}
