import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register');
    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const userId = localStorage.getItem('userId');
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { userId, refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ─── Campus ───────────────────────────────────────────────────────────────────
export const campusApi = {
  list: (search?: string) => api.get('/campus', { params: { search } }).then((r) => r.data),
  get: (id: string) => api.get(`/campus/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/campus', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/campus/${id}`, data).then((r) => r.data),
  getVisits: (id: string) => api.get(`/campus/${id}/visits`).then((r) => r.data),
  createVisit: (id: string, data: any) => api.post(`/campus/${id}/visits`, data).then((r) => r.data),
  updateVisitStatus: (visitId: string, status: string) =>
    api.patch(`/campus/visits/${visitId}/status`, { status }).then((r) => r.data),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: (params?: { campusId?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/students', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/students/${id}`).then((r) => r.data),
  findByQr: (qrCode: string) => api.get(`/students/qr/${qrCode}`).then((r) => r.data),
  create: (data: any) => api.post('/students', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data).then((r) => r.data),
  getQrImage: (id: string) => api.get(`/students/${id}/qr-image`).then((r) => r.data),
  bulkImport: (campusId: string, file: File) => {
    const form = new FormData();
    form.append('campusId', campusId);
    form.append('file', file);
    return api.post('/students/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

// ─── Measurements ─────────────────────────────────────────────────────────────
export const measurementsApi = {
  record: (data: any) => api.post('/measurements', data).then((r) => r.data),
  getForStudent: (studentId: string) =>
    api.get(`/measurements/student/${studentId}`).then((r) => r.data),
  assignSize: (data: any) => api.post('/measurements/size', data).then((r) => r.data),
  getSizeAssignment: (studentId: string) =>
    api.get(`/measurements/size/${studentId}`).then((r) => r.data),
};

// ─── Workflow ─────────────────────────────────────────────────────────────────
export const workflowApi = {
  getStudent: (studentId: string) =>
    api.get(`/workflow/student/${studentId}`).then((r) => r.data),
  transition: (studentId: string, toState: string, reason?: string) =>
    api.post(`/workflow/student/${studentId}/transition`, { toState, reason }).then((r) => r.data),
  submitApproval: (studentId: string) =>
    api.post(`/workflow/student/${studentId}/submit-approval`).then((r) => r.data),
  reviewApproval: (workflowId: string, status: string, notes?: string) =>
    api.post(`/workflow/approvals/${workflowId}/review`, { status, notes }).then((r) => r.data),
  pendingApprovals: () => api.get('/workflow/approvals/pending').then((r) => r.data),
  getByCampusState: (campusId: string, state?: string) =>
    api.get(`/workflow/campus/${campusId}`, { params: { state } }).then((r) => r.data),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getFabricItems: () => api.get('/inventory/fabric').then((r) => r.data),
  createFabricItem: (data: any) => api.post('/inventory/fabric', data).then((r) => r.data),
  addStock: (data: any) => api.post('/inventory/fabric/stock', data).then((r) => r.data),
  recordConsumption: (data: any) => api.post('/inventory/fabric/consume', data).then((r) => r.data),
  getHistory: (id: string) => api.get(`/inventory/fabric/${id}/history`).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  kpis: () => api.get('/analytics/kpis').then((r) => r.data),
  workflowDistribution: (campusId?: string) =>
    api.get('/analytics/workflow-distribution', { params: { campusId } }).then((r) => r.data),
  sizeDistribution: (campusId: string) =>
    api.get(`/analytics/size-distribution/${campusId}`).then((r) => r.data),
  fabricTrend: () => api.get('/analytics/fabric-trend').then((r) => r.data),
  tailorProductivity: () => api.get('/analytics/tailor-productivity').then((r) => r.data),
  dispatchRate: (campusId?: string) =>
    api.get('/analytics/dispatch-rate', { params: { campusId } }).then((r) => r.data),
};
