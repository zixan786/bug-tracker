import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "./User";
import { Bug } from "./Bug";

export enum ProjectStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({
    type: "text",
    default: ProjectStatus.ACTIVE,
  })
  status!: ProjectStatus;

  @Column({ nullable: true })
  repository!: string;

  @Column({ type: "date", nullable: true })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.ownedProjects)
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @Column()
  ownerId!: number;

  @OneToMany(() => Bug, (bug) => bug.project)
  bugs!: Bug[];

  @ManyToMany(() => User)
  @JoinTable({
    name: "project_members",
    joinColumn: { name: "projectId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  members!: User[];

  // Computed properties
  get activeBugsCount(): number {
    return this.bugs?.filter((bug) => bug.status !== "closed").length || 0;
  }

  get totalBugsCount(): number {
    return this.bugs?.length || 0;
  }
}
