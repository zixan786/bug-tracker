import api from "./index";

export const projectAPI = {
  getProjects: (params: { page?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    return api.get(`/projects?${queryParams.toString()}`);
  },

  getMyProjects: (params: { page?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    return api.get(`/projects/my?${queryParams.toString()}`);
  },

  getProjectById: (id: number) => api.get(`/projects/${id}`),

  createProject: (projectData: any) => api.post("/projects", projectData),

  updateProject: (id: number, projectData: any) => api.put(`/projects/${id}`, projectData),

  deleteProject: (id: number) => api.delete(`/projects/${id}`),
    // Add member to project
  addMember: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/members/${userId}`),

};
