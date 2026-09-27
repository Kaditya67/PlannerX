import apiClient from "./client.js"

export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),

  getUsers: (params) => apiClient.get("/admin/users", { params }),

  updateUser: (userId, data) => apiClient.patch(`/admin/users/${userId}`, data),

  resetPassword: (userId, newPassword) =>
    apiClient.post(`/admin/users/${userId}/reset-password`, { newPassword }),

  wipeUserData: (userId) => apiClient.post(`/admin/users/${userId}/wipe-data`),

  getUserDetails: (userId) => apiClient.get(`/admin/users/${userId}/details`),

  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
}
