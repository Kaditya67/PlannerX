import apiClient from "./client.js"

export const sessionAPI = {
  getAll: (params) => apiClient.get("/sessions", { params }),

  create: (data) => apiClient.post("/sessions", data),

  update: (id, data) => apiClient.put(`/sessions/${id}`, data),

  delete: (id) => apiClient.delete(`/sessions/${id}`),

  start: (id) => apiClient.post(`/sessions/${id}/start`),

  complete: (id) => apiClient.post(`/sessions/${id}/complete`),

  generate: (data) => apiClient.post("/sessions/generate", data),
}
