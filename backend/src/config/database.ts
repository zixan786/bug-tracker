import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Project } from "../models/Project";
import { Bug } from "../models/Bug";
import { Comment } from "../models/Comment";
import { Attachment } from "../models/Attachment";
import { BugHistory } from "../models/BugHistory";
import { Workflow } from "../models/Workflow";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "bugtracker.db",
  synchronize: true, // Auto-create tables in development
  logging: true,
  entities: [User, Project, Bug, Comment, Attachment, BugHistory, Workflow],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
