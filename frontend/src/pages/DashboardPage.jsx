import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMetricasDashboard, getMetricasTutor } from '../services/api'
import { formatCLP } from '../utils/formato'

// --- Skeleton ---
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// --- Íconos ---
const icons = {
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  dollar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// --- Componentes de card ---
function MetricCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatFecha(fechaHora) {
  return new Date(fechaHora).toLocaleDateString('es-CL', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\b(\w)/g, (c) => c.toUpperCase())
}

// --- Dashboard Admin ---
function AdminDashboard({ data }) {
  const { ingresos } = data
  const variacion = ingresos?.variacion_porcentual

  const variacionEl = variacion == null ? (
    <span className="text-gray-400">sin datos anteriores</span>
  ) : (
    <span className={variacion >= 0 ? 'text-green-600' : 'text-red-600'}>
      {variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion)}% vs mes anterior
    </span>
  )

  return (
    <>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<span className="text-blue-600">{icons.users}</span>}
          iconBg="bg-blue-50"
          label="Alumnos activos"
          value={data.alumnos_activos}
        />
        <MetricCard
          icon={<span className="text-purple-600">{icons.calendar}</span>}
          iconBg="bg-purple-50"
          label="Sesiones del mes"
          value={data.sesiones_mes?.total}
          sub={`${data.sesiones_mes?.realizadas} realizadas · ${data.sesiones_mes?.agendadas} agendadas`}
        />
        <MetricCard
          icon={<span className="text-green-600">{icons.dollar}</span>}
          iconBg="bg-green-50"
          label="Ingresos del mes"
          value={formatCLP(ingresos?.mes_actual)}
          sub={variacionEl}
        />
        <MetricCard
          icon={<span className="text-yellow-600">{icons.clock}</span>}
          iconBg="bg-yellow-50"
          label="Pagos pendientes"
          value={data.pagos_pendientes?.count}
          sub={`Total: ${formatCLP(data.pagos_pendientes?.monto_total)}`}
        />
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alumnos por tutor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Alumnos por tutor</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.alumnos_por_tutor?.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Sin datos.</p>
            ) : (
              data.alumnos_por_tutor?.map((r) => (
                <div key={r.tutor_id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-700">{r.tutor_nombre}</span>
                  <span className="text-sm font-semibold text-gray-900">{r.count} alumno{r.count !== 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximas sesiones */}
        <ProximasSesiones sesiones={data.proximas_sesiones} />
      </div>
    </>
  )
}

// --- Dashboard Tutor ---
function TutorDashboard({ data, user }) {
  return (
    <>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <MetricCard
          icon={<span className="text-blue-600">{icons.users}</span>}
          iconBg="bg-blue-50"
          label="Mis alumnos"
          value={data.mis_alumnos?.count}
        />
        <MetricCard
          icon={<span className="text-purple-600">{icons.calendar}</span>}
          iconBg="bg-purple-50"
          label="Mis sesiones del mes"
          value={data.sesiones_mes?.total}
          sub={`${data.sesiones_mes?.realizadas} realizadas · ${data.sesiones_mes?.agendadas} agendadas`}
        />
      </div>

      {/* Próximas sesiones */}
      <div className="max-w-lg">
        <ProximasSesiones sesiones={data.proximas_sesiones} />
      </div>
    </>
  )
}

function ProximasSesiones({ sesiones }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Próximas sesiones</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {!sesiones || sesiones.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No hay sesiones próximas.</p>
        ) : (
          sesiones.map((s) => (
            <div key={s.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.alumno?.nombre}</p>
                  <p className="text-xs text-gray-500">{s.materia?.nombre} · {s.duracion_min} min</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">{formatFecha(s.fecha_hora)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- Página principal ---
export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const fetch = isAdmin ? getMetricasDashboard : getMetricasTutor
    fetch()
      .then((r) => setData(r.data.data))
      .catch(() => setError('Error al cargar métricas.'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-0.5">Bienvenido, {user?.nombre}</p>
      </div>

      {/* Skeletons */}
      {loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[...Array(isAdmin ? 4 : 2)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && isAdmin  && <AdminDashboard data={data} />}
      {data && !isAdmin && <TutorDashboard data={data} user={user} />}
    </div>
  )
}
