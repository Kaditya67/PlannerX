import apiClient from "./client.js"

export const planAPI = {
  getAll: (params) => apiClient.get("/plans", { params }),

  getOne: (id) => apiClient.get(`/plans/${id}`),

  create: (data) => apiClient.post("/plans", data),

  update: (id, data) => apiClient.put(`/plans/${id}`, data),

  delete: (id) => apiClient.delete(`/plans/${id}`),

  getStats: (id) => apiClient.get(`/plans/${id}/stats`),
}
