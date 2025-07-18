import { AppDataSource } from "../config/database";
import { Bug, BugStatus } from "../models/Bug";
import { BugHistory, BugHistoryAction } from "../models/BugHistory";
import { Workflow } from "../models/Workflow";
import { User, UserRole } from "../models/User";
import { ApiError } from "../middlewares/error.middleware";

export class BugWorkflowService {
  private bugRepository = AppDataSource.getRepository(Bug);
  private bugHistoryRepository = AppDataSource.getRepository(BugHistory);
  private workflowRepository = AppDataSource.getRepository(Workflow);

  async transitionBugStatus(
    bugId: number,
    newStatus: BugStatus,
    user: User,
    notes?: string
  ): Promise<Bug> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
      relations: ["project", "assignee", "qaAssignee"],
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    const oldStatus = bug.status;

    // Check if transition is allowed
    if (!this.canTransitionStatus(oldStatus, newStatus, user.role)) {
      throw new ApiError(403, `Cannot transition from ${oldStatus} to ${newStatus}`);
    }

    // Update bug status
    bug.status = newStatus;

    // Set timestamps based on status
    if (newStatus === BugStatus.RESOLVED) {
      bug.resolvedAt = new Date();
    } else if (newStatus === BugStatus.CLOSED) {
      bug.closedAt = new Date();
    }

    await this.bugRepository.save(bug);

    // Create history entry
    await this.createHistoryEntry(
      bug.id,
      user.id,
      BugHistoryAction.STATUS_CHANGED,
      oldStatus,
      newStatus,
      notes || `Status changed from ${oldStatus} to ${newStatus}`
    );

    return bug;
  }

  async assignBugToQA(bugId: number, qaUserId: number, user: User): Promise<Bug> {
    const bug = await this.bugRepository.findOne({
      where: { id: bugId },
      relations: ["qaAssignee"],
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    // Check permissions
    if (!["admin", "project_manager", "developer"].includes(user.role)) {
      throw new ApiError(403, "Not authorized to assign QA");
    }

    const oldQAAssignee = bug.qaAssignee?.firstName + " " + bug.qaAssignee?.lastName || "None";
    bug.qaAssigneeId = qaUserId;

    await this.bugRepository.save(bug);

    // Get new QA assignee for history
    const newBug = await this.bugRepository.findOne({
      where: { id: bugId },
      relations: ["qaAssignee"],
    });

    const newQAAssignee = newBug?.qaAssignee?.firstName + " " + newBug?.qaAssignee?.lastName || "None";

    await this.createHistoryEntry(
      bug.id,
      user.id,
      BugHistoryAction.QA_ASSIGNED,
      oldQAAssignee,
      newQAAssignee,
      `QA assigned to ${newQAAssignee}`
    );

    return newBug!;
  }

  async blockBug(bugId: number, blockedByBugId: number, user: User, reason?: string): Promise<Bug> {
    const bug = await this.bugRepository.findOne({ where: { id: bugId } });
    const blockingBug = await this.bugRepository.findOne({ where: { id: blockedByBugId } });

    if (!bug || !blockingBug) {
      throw new ApiError(404, "Bug not found");
    }

    bug.isBlocking = true;
    bug.blockedByBugId = blockedByBugId;

    await this.bugRepository.save(bug);

    await this.createHistoryEntry(
      bug.id,
      user.id,
      BugHistoryAction.BLOCKED,
      "false",
      `Bug #${blockedByBugId}`,
      reason || `Bug blocked by #${blockedByBugId}`
    );

    return bug;
  }

  async unblockBug(bugId: number, user: User, reason?: string): Promise<Bug> {
    const bug = await this.bugRepository.findOne({ where: { id: bugId } });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    const oldBlockingBugId = bug.blockedByBugId;
    bug.isBlocking = false;
    bug.blockedByBugId = null;

    await this.bugRepository.save(bug);

    await this.createHistoryEntry(
      bug.id,
      user.id,
      BugHistoryAction.UNBLOCKED,
      `Bug #${oldBlockingBugId}`,
      "false",
      reason || "Bug unblocked"
    );

    return bug;
  }

  async getBugHistory(bugId: number): Promise<BugHistory[]> {
    return this.bugHistoryRepository.find({
      where: { bugId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  private canTransitionStatus(
    fromStatus: BugStatus,
    toStatus: BugStatus,
    userRole: UserRole
  ): boolean {
    // Admin and Project Manager can transition to any status
    if (["admin", "project_manager"].includes(userRole)) {
      return true;
    }

    // Define allowed transitions by role
    const transitions: Record<UserRole, Record<BugStatus, BugStatus[]>> = {
      admin: {} as Record<BugStatus, BugStatus[]>, // Admin can do anything
      project_manager: {} as Record<BugStatus, BugStatus[]>, // PM can do anything
      developer: {
        [BugStatus.OPEN]: [BugStatus.IN_PROGRESS],
        [BugStatus.IN_PROGRESS]: [BugStatus.CODE_REVIEW, BugStatus.RESOLVED],
        [BugStatus.CODE_REVIEW]: [BugStatus.IN_PROGRESS, BugStatus.QA_TESTING],
        [BugStatus.REOPENED]: [BugStatus.IN_PROGRESS],
        [BugStatus.QA_TESTING]: [], // Developers can't change from QA_TESTING
        [BugStatus.RESOLVED]: [], // Developers can't change from RESOLVED
        [BugStatus.CLOSED]: [], // Developers can't change from CLOSED
        [BugStatus.REJECTED]: [BugStatus.IN_PROGRESS], // Can fix rejected bugs
      },
      qa: {
        [BugStatus.QA_TESTING]: [BugStatus.RESOLVED, BugStatus.REOPENED],
        [BugStatus.RESOLVED]: [BugStatus.CLOSED, BugStatus.REOPENED],
        [BugStatus.CLOSED]: [BugStatus.REOPENED],
        [BugStatus.OPEN]: [], // QA can't take open bugs directly
        [BugStatus.IN_PROGRESS]: [], // QA can't change in-progress bugs
        [BugStatus.CODE_REVIEW]: [BugStatus.QA_TESTING], // QA can take bugs from code review
        [BugStatus.REOPENED]: [], // QA can't change reopened bugs
        [BugStatus.REJECTED]: [], // QA can't change rejected bugs
      },
      tester: {
        [BugStatus.QA_TESTING]: [BugStatus.RESOLVED, BugStatus.REOPENED],
        [BugStatus.RESOLVED]: [BugStatus.CLOSED, BugStatus.REOPENED],
        [BugStatus.CLOSED]: [BugStatus.REOPENED],
        [BugStatus.OPEN]: [], // Testers can't take open bugs directly
        [BugStatus.IN_PROGRESS]: [], // Testers can't change in-progress bugs
        [BugStatus.CODE_REVIEW]: [BugStatus.QA_TESTING], // Testers can take bugs from code review
        [BugStatus.REOPENED]: [], // Testers can't change reopened bugs
        [BugStatus.REJECTED]: [], // Testers can't change rejected bugs
      },
      client: {
        [BugStatus.CLOSED]: [BugStatus.REOPENED], // Clients can only reopen closed bugs
        [BugStatus.OPEN]: [],
        [BugStatus.IN_PROGRESS]: [],
        [BugStatus.CODE_REVIEW]: [],
        [BugStatus.QA_TESTING]: [],
        [BugStatus.RESOLVED]: [],
        [BugStatus.REOPENED]: [],
        [BugStatus.REJECTED]: [],
      },
      viewer: {} as Record<BugStatus, BugStatus[]>, // Viewers can't change anything
    };

    const allowedTransitions = transitions[userRole]?.[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  private async createHistoryEntry(
    bugId: number,
    userId: number,
    action: BugHistoryAction,
    oldValue?: string,
    newValue?: string,
    description?: string
  ): Promise<BugHistory> {
    const historyEntry = this.bugHistoryRepository.create({
      bugId,
      userId,
      action,
      oldValue,
      newValue,
      description,
    });

    return this.bugHistoryRepository.save(historyEntry);
  }
}
