import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Alumnos ---
export const getAlumnos = (params) => api.get('/alumnos', { params })
export const getAlumno  = (id)     => api.get(`/alumnos/${id}`)
export const createAlumno = (data) => api.post('/alumnos', { alumno: data })
export const updateAlumno = (id, data) => api.patch(`/alumnos/${id}`, { alumno: data })
export const deleteAlumno = (id)   => api.delete(`/alumnos/${id}`)

// --- Tutores ---
export const getTutores = () => api.get('/tutores')

// --- Materias ---
export const getMaterias = () => api.get('/materias')

// --- Sesiones ---
export const getSesiones     = (params) => api.get('/sesiones', { params })
export const getSesion       = (id)     => api.get(`/sesiones/${id}`)
export const createSesion    = (data)   => api.post('/sesiones', { sesion: data })
export const updateSesion    = (id, data) => api.patch(`/sesiones/${id}`, { sesion: data })
export const deleteSesion    = (id)     => api.delete(`/sesiones/${id}`)

// --- Métricas ---
export const getMetricasDashboard = () => api.get('/metricas/dashboard')
export const getMetricasTutor     = () => api.get('/metricas/tutor')

// --- Pagos ---
export const getPagos          = (params) => api.get('/pagos', { params })
export const createPago        = (data)   => api.post('/pagos', { pago: data })
export const updatePago        = (id, data) => api.patch(`/pagos/${id}`, { pago: data })
export const deletePago        = (id)     => api.delete(`/pagos/${id}`)
export const generarPendientes = (data)   => api.post('/pagos/generar_pendientes', data)

// --- Apoderados ---
export const getApoderados  = ()       => api.get('/apoderados')
export const createApoderado = (data)  => api.post('/apoderados', { apoderado: data })

// --- Pre-registros ---
export const getPreRegistros    = (params)     => api.get('/pre_registros', { params })
export const updatePreRegistro  = (id, data)   => api.patch(`/pre_registros/${id}`, data)

export default api
