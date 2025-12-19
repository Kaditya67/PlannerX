import apiClient from "./client.js"

export const itemAPI = {
  getAll: (params) => apiClient.get("/items", { params }),

  getOne: (id) => apiClient.get(`/items/${id}`),

  create: (data) => apiClient.post("/items", data),

  update: (id, data) => apiClient.put(`/items/${id}`, data),

  delete: (id) => apiClient.delete(`/items/${id}`),

  reorder: (items) => apiClient.put("/items/reorder", { items }),
}
