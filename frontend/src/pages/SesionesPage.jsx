import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSesiones, updateSesion } from '../services/api'
import SesionActions from '../components/SesionActions'

const ESTADO_TABS = [
  { value: '',           label: 'Todas' },
  { value: 'agendada',   label: 'Agendadas' },
  { value: 'realizada',  label: 'Realizadas' },
  { value: 'cancelada',  label: 'Canceladas' },
]

const ESTADO_BADGE = {
  agendada:  'bg-blue-100 text-blue-800',
  realizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
}

const ESTADO_LABEL = {
  agendada:  'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
}

function formatFecha(fechaHora) {
  const d = new Date(fechaHora)
  return d.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\b(\w)/g, (c) => c.toUpperCase())
}

// Devuelve "YYYY-Www" de la semana que contiene la fecha
function toWeekValue(date) {
  const d = new Date(date)
  // ISO week calculation
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = d - startOfWeek
  const week = Math.ceil((diff / 86400000 + 1) / 7)
  const year = d.getFullYear()
  return `${year}-W${String(week).padStart(2, '0')}`
}

// Devuelve [inicio, fin] de la semana ISO dada "YYYY-Www"
function weekRange(weekValue) {
  const [yearStr, wStr] = weekValue.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(wStr)
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return [monday, sunday]
}

export default function SesionesPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const [sesiones, setSesiones] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [estadoTab, setEstadoTab] = useState('')
  const [weekValue, setWeekValue] = useState(toWeekValue(new Date()))
  const [expandedId, setExpandedId] = useState(null)

  const fetchSesiones = useCallback(async (estado, week) => {
    setLoading(true)
    setError(null)
    try {
      const [desde, hasta] = weekRange(week)
      const params = {
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      }
      if (estado) params.estado = estado
      const res = await getSesiones(params)
      setSesiones(res.data.data)
      setTotal(res.data.meta.total)
    } catch {
      setError('Error al cargar sesiones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSesiones(estadoTab, weekValue)
  }, [estadoTab, weekValue, fetchSesiones])

  async function handleUpdateEstado(sesionId, nuevoEstado, notas) {
    await updateSesion(sesionId, { estado: nuevoEstado, notas })
    fetchSesiones(estadoTab, weekValue)
    setExpandedId(null)
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sesiones</h1>
        <button
          onClick={() => navigate('/sesiones/nueva')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nueva sesión
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Selector de semana */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Semana:</label>
          <input
            type="week"
            value={weekValue}
            onChange={(e) => setWeekValue(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              const [start] = weekRange(weekValue)
              start.setDate(start.getDate() - 7)
              setWeekValue(toWeekValue(start))
            }}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
            title="Semana anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              const [start] = weekRange(weekValue)
              start.setDate(start.getDate() + 7)
              setWeekValue(toWeekValue(start))
            }}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
            title="Semana siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekValue(toWeekValue(new Date()))}
            className="text-xs text-blue-600 hover:underline"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {ESTADO_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setEstadoTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              estadoTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Fecha / Hora', 'Alumno', ...(isAdmin ? ['Tutor'] : []), 'Materia', 'Duración', 'Estado', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-sm text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : sesiones.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No hay sesiones para esta semana.
                </td>
              </tr>
            ) : (
              sesiones.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatFecha(s.fecha_hora)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {s.alumno.nombre}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {s.tutor.nombre}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {s.materia.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {s.duracion_min} min
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[s.estado]}`}>
                        {ESTADO_LABEL[s.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expandedId === s.id ? 'Cerrar' : 'Acciones'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                        <SesionActions
                          sesion={s}
                          onUpdate={handleUpdateEstado}
                          onCancel={() => setExpandedId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            {total} sesión{total !== 1 ? 'es' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
