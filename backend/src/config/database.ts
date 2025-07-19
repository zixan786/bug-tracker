import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { OrganizationMember } from "../models/OrganizationMember";
import { Project } from "../models/Project";
import { Bug } from "../models/Bug";
import { Comment } from "../models/Comment";
import { Attachment } from "../models/Attachment";
import { BugHistory } from "../models/BugHistory";
import { Workflow } from "../models/Workflow";
import { Plan } from "../models/Plan";
import { Subscription } from "../models/Subscription";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "bugtracker.db",
  synchronize: true, // Auto-create tables in development
  logging: false,
  entities: [User, Organization, OrganizationMember, Project, Bug, Comment, Attachment, BugHistory, Workflow, Plan, Subscription],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
