import apiClient from "./client.js"

export const authAPI = {
  login: (credentials) => apiClient.post("/auth/login", credentials),

  demoLogin: () => apiClient.post("/auth/demo"),

  register: (userData) => apiClient.post("/auth/register", userData),

  logout: () => apiClient.post("/auth/logout"),

  getMe: () => apiClient.get("/auth/me"),

  updateProfile: (data) => apiClient.put("/auth/me", data),

  changePassword: (data) => apiClient.put("/auth/password", data),
}
