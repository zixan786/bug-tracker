import api from "./index";

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/login", credentials),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => api.post("/auth/register", userData),

  getProfile: () => api.get("/auth/profile"),

  refreshToken: () => api.post("/auth/refresh"),
};
