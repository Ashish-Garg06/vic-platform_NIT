import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api'
})
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vic_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
api.interceptors.response.use(r => r.data, e => Promise.reject(e.response?.data || { error: 'Network error' }))
export default api
