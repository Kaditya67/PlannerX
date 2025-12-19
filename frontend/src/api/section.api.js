import apiClient from "./client.js"

export const sectionAPI = {
  getAll: (params) => apiClient.get("/sections", { params }),

  create: (data) => apiClient.post("/sections", data),

  update: (id, data) => apiClient.put(`/sections/${id}`, data),

  delete: (id) => apiClient.delete(`/sections/${id}`),

  reorder: (sections) => apiClient.put("/sections/reorder", { sections }),
}
