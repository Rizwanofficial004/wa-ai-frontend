import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip redirect for public endpoints
    const publicEndpoints = ['/validate/', '/register', '/login', '/businesses/validate/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      error.config?.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && !isPublicEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================
// AUTH API
// =====================
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// =====================
// BUSINESS API
// =====================
export const businessApi = {
  getAll: () => api.get('/businesses'),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  getStats: (id) => api.get(`/businesses/${id}/stats`),
  connectWhatsApp: (id, data) => api.post(`/businesses/${id}/whatsapp/connect`, data),
  testWhatsApp: (id, data) => api.post(`/businesses/${id}/whatsapp/test`, data),
  toggleAI: (id, enabled) => api.put(`/businesses/${id}/ai/toggle`, { enabled }),
  updateSettings: (id, settings) => api.put(`/businesses/${id}/settings`, settings)
};

// =====================
// CONVERSATION API
// =====================
export const conversationApi = {
  getAll: (businessId, params) => api.get(`/businesses/${businessId}/conversations`, { params }),
  getById: (businessId, conversationId) => api.get(`/businesses/${businessId}/conversations/${conversationId}`),
  updateStatus: (businessId, conversationId, status) => 
    api.put(`/businesses/${businessId}/conversations/${conversationId}/status`, { status }),
  getMessages: (businessId, conversationId) => 
    api.get(`/businesses/${businessId}/conversations/${conversationId}/messages`),
  sendMessage: (businessId, conversationId, content) =>
    api.post(`/businesses/${businessId}/conversations/${conversationId}/messages`, { content }),
  requestHandoff: (businessId, conversationId, reason = 'manual') =>
    api.post(`/businesses/${businessId}/conversations/${conversationId}/handoff`, { reason })
};

// =====================
// AGENT API (NEW)
// =====================
export const agentApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/agents`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/agents`, data),
  update: (businessId, agentId, data) => api.put(`/businesses/${businessId}/agents/${agentId}`, data),
  delete: (businessId, agentId) => api.delete(`/businesses/${businessId}/agents/${agentId}`),
  updateStatus: (businessId, agentId, status) => 
    api.put(`/businesses/${businessId}/agents/${agentId}/status`, { status }),
  getConversations: (businessId, agentId) => 
    api.get(`/businesses/${businessId}/agents/${agentId}/conversations`),
  getOnline: (businessId) => api.get(`/businesses/${businessId}/agents-online`),
  
  // Handoff
  getHandoffQueue: (businessId) => api.get(`/businesses/${businessId}/handoff-queue`),
  assignAgent: (businessId, conversationId, agentId) => 
    api.post(`/businesses/${businessId}/conversations/${conversationId}/assign`, { agentId }),
  transferAgent: (businessId, conversationId, toAgentId, reason) => 
    api.post(`/businesses/${businessId}/conversations/${conversationId}/transfer`, { toAgentId, reason }),
  returnToBot: (businessId, conversationId) => 
    api.post(`/businesses/${businessId}/conversations/${conversationId}/return-to-bot`)
};

// =====================
// AUTOMATION API (NEW)
// =====================
export const automationApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/automation-rules`),
  getById: (businessId, ruleId) => api.get(`/businesses/${businessId}/automation-rules/${ruleId}`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/automation-rules`, data),
  update: (businessId, ruleId, data) => api.put(`/businesses/${businessId}/automation-rules/${ruleId}`, data),
  delete: (businessId, ruleId) => api.delete(`/businesses/${businessId}/automation-rules/${ruleId}`),
  toggle: (businessId, ruleId) => api.patch(`/businesses/${businessId}/automation-rules/${ruleId}/toggle`),
  reorder: (businessId, ruleIds) => api.put(`/businesses/${businessId}/automation-rules/reorder`, { ruleIds })
};

// =====================
// BROADCAST API (NEW)
// =====================
export const broadcastApi = {
  getAll: (businessId, params) => api.get(`/businesses/${businessId}/broadcasts`, { params }),
  getById: (businessId, broadcastId) => api.get(`/businesses/${businessId}/broadcasts/${broadcastId}`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/broadcasts`, data),
  start: (businessId, broadcastId) => api.post(`/businesses/${businessId}/broadcasts/${broadcastId}/start`),
  schedule: (businessId, broadcastId, scheduledAt) => 
    api.post(`/businesses/${businessId}/broadcasts/${broadcastId}/schedule`, { scheduledAt }),
  cancel: (businessId, broadcastId) => api.post(`/businesses/${businessId}/broadcasts/${broadcastId}/cancel`),
  delete: (businessId, broadcastId) => api.delete(`/businesses/${businessId}/broadcasts/${broadcastId}`),
  getTargetPreview: (businessId, target) => 
    api.post(`/businesses/${businessId}/broadcasts/target-preview`, { target })
};

// =====================
// ANALYTICS API (NEW)
// =====================
export const analyticsApi = {
  getDashboard: (businessId, params) => api.get(`/businesses/${businessId}/analytics/dashboard`, { params }),
  getConversations: (businessId, params) => api.get(`/businesses/${businessId}/analytics/conversations`, { params }),
  getLeads: (businessId, params) => api.get(`/businesses/${businessId}/analytics/leads`, { params }),
  getOrders: (businessId, params) => api.get(`/businesses/${businessId}/analytics/orders`, { params }),
  getAI: (businessId, params) => api.get(`/businesses/${businessId}/analytics/ai`, { params }),
  record: (businessId, date) => api.post(`/businesses/${businessId}/analytics/record`, { date })
};

// =====================
// TAG API (NEW)
// =====================
export const tagApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/tags`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/tags`, data),
  update: (businessId, tagId, data) => api.put(`/businesses/${businessId}/tags/${tagId}`, data),
  delete: (businessId, tagId) => api.delete(`/businesses/${businessId}/tags/${tagId}`),
  
  // Conversation tags
  addTagToConversation: (businessId, conversationId, tagName, tagColor) => 
    api.post(`/businesses/${businessId}/conversations/${conversationId}/tags`, { tagName, tagColor }),
  removeTagFromConversation: (businessId, conversationId, tagName) => 
    api.delete(`/businesses/${businessId}/conversations/${conversationId}/tags/${tagName}`),
  getConversationsByTag: (businessId, tagName) => 
    api.get(`/businesses/${businessId}/tags/${tagName}/conversations`)
};

// =====================
// KNOWLEDGE BASE API
// =====================
export const knowledgeApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/knowledge`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/knowledge`, data),
  update: (businessId, knowledgeId, data) => api.put(`/businesses/${businessId}/knowledge/${knowledgeId}`, data),
  delete: (businessId, knowledgeId) => api.delete(`/businesses/${businessId}/knowledge/${knowledgeId}`),
  seed: (businessId) => api.post(`/businesses/${businessId}/knowledge/seed`),
  uploadPdf: (businessId, file, extra = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (extra.title) form.append('title', extra.title);
    if (extra.category) form.append('category', extra.category);
    if (extra.tags) form.append('tags', extra.tags);
    return api.post(`/businesses/${businessId}/knowledge/upload`, form);
  }
};

// =====================
// ORDER API
// =====================
export const orderApi = {
  getAll: (businessId, params) => api.get(`/businesses/${businessId}/orders`, { params }),
  getById: (businessId, orderId) => api.get(`/businesses/${businessId}/orders/${orderId}`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/orders`, data),
  update: (businessId, orderId, data) => api.put(`/businesses/${businessId}/orders/${orderId}`, data),
  delete: (businessId, orderId) => api.delete(`/businesses/${businessId}/orders/${orderId}`)
};

// =====================
// LEAD API
// =====================
export const leadApi = {
  getAll: (businessId, params) => api.get(`/businesses/${businessId}/leads`, { params }),
  getById: (businessId, leadId) => api.get(`/businesses/${businessId}/leads/${leadId}`),
  update: (businessId, leadId, data) => api.put(`/businesses/${businessId}/leads/${leadId}`, data)
};

// =====================
// PRODUCT API
// =====================
export const productApi = {
  getAll: (businessId, params) => api.get(`/businesses/${businessId}/products`, { params }),
  getById: (businessId, productId) => api.get(`/businesses/${businessId}/products/${productId}`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/products`, data),
  update: (businessId, productId, data) => api.put(`/businesses/${businessId}/products/${productId}`, data),
  delete: (businessId, productId) => api.delete(`/businesses/${businessId}/products/${productId}`),
  getBrands: (businessId) => api.get(`/businesses/${businessId}/products/brands`),
  getCategories: (businessId) => api.get(`/businesses/${businessId}/products/categories`)
};

export const serviceApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/services`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/services`, data),
  update: (businessId, serviceId, data) => api.put(`/businesses/${businessId}/services/${serviceId}`, data),
  delete: (businessId, serviceId) => api.delete(`/businesses/${businessId}/services/${serviceId}`)
};

// =====================
// INVITE API (NEW)
// =====================
export const inviteApi = {
  getAll: (businessId) => api.get(`/businesses/${businessId}/invites`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/invites`, data),
  cancel: (businessId, inviteId) => api.delete(`/businesses/${businessId}/invites/${inviteId}`),
  resend: (businessId, inviteId) => api.post(`/businesses/${businessId}/invites/${inviteId}/resend`),
  validate: (token) => api.get(`/businesses/validate/${token}`),
  acceptInvite: (token, userData) => api.post(`/businesses/invite/${token}/accept`, userData),
  sendViaWhatsApp: (businessId, inviteId, phoneNumber) => 
    api.post(`/businesses/${businessId}/invites/${inviteId}/send-whatsapp`, { phoneNumber })
};

export default api;
