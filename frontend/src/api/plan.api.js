import apiClient from "./client.js"

export const planAPI = {
  getAll: (params) => apiClient.get("/plans", { params }),

  getOne: (id) => apiClient.get(`/plans/${id}`),

  create: (data) => apiClient.post("/plans", data),

  update: (id, data) => apiClient.put(`/plans/${id}`, data),

  delete: (id) => apiClient.delete(`/plans/${id}`),

  getStats: (id) => apiClient.get(`/plans/${id}/stats`),

  importStructure: (id, sections) => apiClient.post(`/plans/${id}/import`, { sections }),

  getTemplate: (id) => apiClient.get(`/plans/${id}/template`),

  cloneFromTemplate: (data) => apiClient.post("/plans/clone-template", data),
}
