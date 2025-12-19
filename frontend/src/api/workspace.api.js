import apiClient from "./client.js"

export const workspaceAPI = {
  getAll: () => apiClient.get("/workspaces"),

  getOne: (id) => apiClient.get(`/workspaces/${id}`),

  create: (data) => apiClient.post("/workspaces", data),

  update: (id, data) => apiClient.put(`/workspaces/${id}`, data),

  delete: (id) => apiClient.delete(`/workspaces/${id}`),

  addMember: (id, data) => apiClient.post(`/workspaces/${id}/members`, data),

  removeMember: (id, userId) => apiClient.delete(`/workspaces/${id}/members/${userId}`),
}
