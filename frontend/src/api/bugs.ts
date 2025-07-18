import api from "./index";

export const bugAPI = {
  getBugs: (params: {
    page?: number;
    limit?: number;
    filters?: {
      status?: string;
      priority?: string;
      severity?: string;
      type?: string;
      projectId?: number;
      assigneeId?: number;
      reporterId?: number;
      search?: string;
    };
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return api.get(`/bugs?${queryParams.toString()}`);
  },

  getBugById: (id: number) => api.get(`/bugs/${id}`),

  createBug: (bugData: any) => api.post("/bugs", bugData),

  updateBug: (id: number, bugData: any) => api.put(`/bugs/${id}`, bugData),

  deleteBug: (id: number) => api.delete(`/bugs/${id}`),

  addComment: (bugId: number, commentData: { content: string; isInternal?: boolean }) =>
    api.post(`/bugs/${bugId}/comments`, commentData),

  // Enhanced workflow endpoints
  transitionBugStatus: (bugId: number, status: string, notes?: string) =>
    api.put(`/bugs/${bugId}/status`, { status, notes }),

  assignBugToQA: (bugId: number, qaUserId: number) =>
    api.put(`/bugs/${bugId}/qa-assign`, { qaUserId }),

  blockBug: (bugId: number, blockedByBugId: number, reason?: string) =>
    api.put(`/bugs/${bugId}/block`, { blockedByBugId, reason }),

  unblockBug: (bugId: number, reason?: string) =>
    api.put(`/bugs/${bugId}/unblock`, { reason }),

  getBugHistory: (bugId: number) =>
    api.get(`/bugs/${bugId}/history`),
};
