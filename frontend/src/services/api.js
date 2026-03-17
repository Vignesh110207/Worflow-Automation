import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

const token = localStorage.getItem('ff_token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      delete api.defaults.headers.common['Authorization']
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(new Error(msg))
  }
)

export const workflowApi = {
  list:    (p=0,s=10,search='') => api.get('/workflows', { params:{page:p,size:s,search} }),
  get:     (id)       => api.get(`/workflows/${id}`),
  create:  (d)        => api.post('/workflows', d),
  update:  (id,d)     => api.put(`/workflows/${id}`, d),
  delete:  (id)       => api.delete(`/workflows/${id}`),
  execute: (id,d)     => api.post(`/workflows/${id}/execute`, d),
  listSteps: (wid)    => api.get(`/workflows/${wid}/steps`),
  addStep:   (wid,d)  => api.post(`/workflows/${wid}/steps`, d),
}

export const stepApi = {
  update:    (id,d)   => api.put(`/steps/${id}`, d),
  delete:    (id)     => api.delete(`/steps/${id}`),
  listRules: (sid)    => api.get(`/steps/${sid}/rules`),
  addRule:   (sid,d)  => api.post(`/steps/${sid}/rules`, d),
  create:    (wid,d)  => api.post(`/workflows/${wid}/steps`, d),
}

export const ruleApi = {
  update: (id,d) => api.put(`/rules/${id}`, d),
  delete: (id)   => api.delete(`/rules/${id}`),
}

export const executionApi = {
  list:    (p=0,s=10,params={}) => api.get('/executions', { params:{page:p,size:s,...params} }),
  get:     (id)  => api.get(`/executions/${id}`),
  cancel:  (id)  => api.post(`/executions/${id}/cancel`),
  retry:   (id)  => api.post(`/executions/${id}/retry`),
  approve: (id,d)=> api.post(`/executions/${id}/approve`, d),
  logs:    (p=0,s=25) => api.get('/executions/logs', { params:{page:p,size:s} }),
}

export const notifApi = {
  list:        ()   => api.get('/notifications'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()   => api.put('/notifications/read-all'),
}

export const adminApi = {
  stats:      ()              => api.get('/admin/stats'),
  auditLogs:  (p=0,s=20,q='')=> api.get('/audit-logs', { params:{page:p,size:s,search:q} }),
  users:      (p=0,s=10,q='')=> api.get('/admin/users', { params:{page:p,size:s,search:q} }),
  updateUser: (id,d)          => api.put(`/admin/users/${id}`, d),
  deleteUser: (id)            => api.delete(`/admin/users/${id}`),
}

export default api
