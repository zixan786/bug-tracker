import api from "./index";

export const userAPI = {
  getUsers: (params: { page?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    return api.get(`/users?${queryParams.toString()}`);
  },

  getUserById: (id: number) => api.get(`/users/${id}`),

  createUser: (userData: any) => api.post("/users", userData),

  updateUser: (id: number, userData: any) => api.put(`/users/${id}`, userData),

  changePassword: (id: number, passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => api.put(`/users/${id}/password`, passwordData),

  deleteUser: (id: number) => api.delete(`/users/${id}`),
};
