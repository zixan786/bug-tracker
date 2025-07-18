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

export enum WorkflowType {
  BUG = "bug",
  FEATURE = "feature",
  TASK = "task",
}

@Entity("workflows")
export class Workflow {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({
    type: "text",
    default: WorkflowType.BUG,
  })
  type!: WorkflowType;

  @Column({ type: "json" })
  states!: Array<{
    id: string;
    name: string;
    description?: string;
    color: string;
    isInitial?: boolean;
    isFinal?: boolean;
    requiredRoles?: string[];
  }>;

  @Column({ type: "json" })
  transitions!: Array<{
    id: string;
    name: string;
    fromState: string;
    toState: string;
    requiredRoles?: string[];
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions?: Array<{
      type: string;
      config: any;
    }>;
  }>;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column({ nullable: true })
  projectId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

  @Column()
  createdById!: number;

  // Helper methods
  getInitialState(): string | null {
    const initialState = this.states.find(state => state.isInitial);
    return initialState ? initialState.id : null;
  }

  getFinalStates(): string[] {
    return this.states.filter(state => state.isFinal).map(state => state.id);
  }

  canTransition(fromState: string, toState: string, userRole: string): boolean {
    const transition = this.transitions.find(
      t => t.fromState === fromState && t.toState === toState
    );

    if (!transition) {
      return false;
    }

    if (transition.requiredRoles && transition.requiredRoles.length > 0) {
      return transition.requiredRoles.includes(userRole);
    }

    return true;
  }

  getAvailableTransitions(fromState: string, userRole: string): Array<{
    id: string;
    name: string;
    toState: string;
    toStateName: string;
  }> {
    return this.transitions
      .filter(t => t.fromState === fromState)
      .filter(t => this.canTransition(fromState, t.toState, userRole))
      .map(t => ({
        id: t.id,
        name: t.name,
        toState: t.toState,
        toStateName: this.states.find(s => s.id === t.toState)?.name || t.toState,
      }));
  }
}
