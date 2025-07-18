// Role-based permission utilities for the frontend

export type UserRole = "admin" | "project_manager" | "developer" | "qa" | "tester" | "client" | "viewer";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Permission checking functions
export const canManageUsers = (role: UserRole): boolean => {
  return role === "admin";
};

export const canManageProjects = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer"].includes(role);
};

export const canCreateProjects = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer", "qa", "tester"].includes(role);
};

export const canManageBugs = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer", "qa", "tester"].includes(role);
};

export const canCreateBugs = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer", "qa", "tester", "client"].includes(role);
};

export const canAssignBugs = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer", "qa"].includes(role);
};

export const canDeleteBugs = (role: UserRole): boolean => {
  return ["admin", "project_manager"].includes(role);
};

export const canViewReports = (role: UserRole): boolean => {
  return ["admin", "project_manager", "developer", "qa"].includes(role);
};

export const canViewAnalytics = (role: UserRole): boolean => {
  return ["admin", "project_manager"].includes(role);
};

export const canManageWorkflows = (role: UserRole): boolean => {
  return ["admin", "project_manager"].includes(role);
};

export const canViewSensitiveData = (role: UserRole): boolean => {
  return ["admin", "project_manager"].includes(role);
};

export const canManageIntegrations = (role: UserRole): boolean => {
  return ["admin", "project_manager"].includes(role);
};

export const canModerateComments = (role: UserRole): boolean => {
  return ["admin", "project_manager", "qa"].includes(role);
};

// Bug status transition permissions
export const canTransitionBugStatus = (
  role: UserRole, 
  fromStatus: string, 
  toStatus: string
): boolean => {
  // Admin and Project Manager can transition to any status
  if (["admin", "project_manager"].includes(role)) {
    return true;
  }

  // Developers can mark bugs as in_progress, resolved
  if (role === "developer") {
    if (fromStatus === "open" && toStatus === "in_progress") return true;
    if (fromStatus === "in_progress" && toStatus === "resolved") return true;
    if (fromStatus === "reopened" && toStatus === "in_progress") return true;
    return false;
  }

  // QA/Testers can mark bugs as resolved, closed, or reopen them
  if (["qa", "tester"].includes(role)) {
    if (fromStatus === "resolved" && toStatus === "closed") return true;
    if (fromStatus === "resolved" && toStatus === "reopened") return true;
    if (fromStatus === "closed" && toStatus === "reopened") return true;
    return false;
  }

  // Clients can only reopen closed bugs
  if (role === "client") {
    if (fromStatus === "closed" && toStatus === "reopened") return true;
    return false;
  }

  return false;
};

// Project access permissions
export const canAccessProject = (
  user: User, 
  project: { ownerId: number; members?: Array<{ id: number }> }
): boolean => {
  // Admin and Project Manager can access all projects
  if (["admin", "project_manager"].includes(user.role)) {
    return true;
  }

  // Owner can access their own projects
  if (project.ownerId === user.id) {
    return true;
  }

  // Members can access projects they're assigned to
  if (project.members?.some(member => member.id === user.id)) {
    return true;
  }

  return false;
};

// Bug access permissions
export const canAccessBug = (
  user: User,
  bug: { 
    reporterId: number; 
    assigneeId?: number; 
    project: { ownerId: number; members?: Array<{ id: number }> } 
  }
): boolean => {
  // Admin and Project Manager can access all bugs
  if (["admin", "project_manager"].includes(user.role)) {
    return true;
  }

  // Reporter can access bugs they reported
  if (bug.reporterId === user.id) {
    return true;
  }

  // Assignee can access bugs assigned to them
  if (bug.assigneeId === user.id) {
    return true;
  }

  // Project members can access bugs in their projects
  if (canAccessProject(user, bug.project)) {
    return true;
  }

  return false;
};

// Role display utilities
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    admin: "Administrator",
    project_manager: "Project Manager",
    developer: "Developer",
    qa: "QA Engineer",
    tester: "Tester",
    client: "Client",
    viewer: "Viewer"
  };
  return roleNames[role] || role;
};

export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    admin: "#d32f2f",
    project_manager: "#1976d2",
    developer: "#388e3c",
    qa: "#f57c00",
    tester: "#7b1fa2",
    client: "#0288d1",
    viewer: "#616161"
  };
  return roleColors[role] || "#616161";
};

// Navigation permissions
export const getAvailableNavItems = (role: UserRole) => {
  const baseItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Bugs", path: "/bugs", icon: "bug_report" }
  ];

  const roleBasedItems: Record<UserRole, Array<{ name: string; path: string; icon: string }>> = {
    admin: [
      ...baseItems,
      { name: "Projects", path: "/projects", icon: "folder" },
      { name: "Users", path: "/users", icon: "people" },
      { name: "Analytics", path: "/analytics", icon: "analytics" },
      { name: "Settings", path: "/settings", icon: "settings" }
    ],
    project_manager: [
      ...baseItems,
      { name: "Projects", path: "/projects", icon: "folder" },
      { name: "Analytics", path: "/analytics", icon: "analytics" },
      { name: "Reports", path: "/reports", icon: "assessment" }
    ],
    developer: [
      ...baseItems,
      { name: "Projects", path: "/projects", icon: "folder" },
      { name: "My Tasks", path: "/my-tasks", icon: "assignment" }
    ],
    qa: [
      ...baseItems,
      { name: "Projects", path: "/projects", icon: "folder" },
      { name: "Test Cases", path: "/test-cases", icon: "checklist" }
    ],
    tester: [
      ...baseItems,
      { name: "Projects", path: "/projects", icon: "folder" },
      { name: "Test Cases", path: "/test-cases", icon: "checklist" }
    ],
    client: [
      ...baseItems,
      { name: "My Reports", path: "/my-reports", icon: "report" }
    ],
    viewer: [
      { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
      { name: "View Bugs", path: "/bugs", icon: "visibility" }
    ]
  };

  return roleBasedItems[role] || baseItems;
};
