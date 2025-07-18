import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  ManyToMany,
} from "typeorm";
import bcrypt from "bcryptjs";
import { Project } from "./Project";
import { Bug } from "./Bug";
import { Comment } from "./Comment";

export enum UserRole {
  ADMIN = "admin",
  PROJECT_MANAGER = "project_manager",
  DEVELOPER = "developer",
  QA = "qa",
  TESTER = "tester",
  CLIENT = "client",
  VIEWER = "viewer",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({
    type: "text",
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  avatar!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects!: Project[];

  @OneToMany(() => Bug, (bug) => bug.reporter)
  reportedBugs!: Bug[];

  @OneToMany(() => Bug, (bug) => bug.assignee)
  assignedBugs!: Bug[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @ManyToMany(() => Project, project => project.members)
  projects: Project[];


  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
