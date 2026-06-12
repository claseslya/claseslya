import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlumno, deleteAlumno } from '../services/api'
import { CURSO_LABELS, NIVEL_LABELS } from '../utils/cursos'

function InfoRow({ label, value }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{value ?? <span className="text-gray-400 italic">—</span>}</dd>
    </div>
  )
}

export default function AlumnoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [alumno, setAlumno] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [desactivando, setDesactivando] = useState(false)

  useEffect(() => {
    getAlumno(id)
      .then((res) => setAlumno(res.data.data))
      .catch(() => setError('No se pudo cargar el alumno.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDesactivar() {
    if (!confirm('¿Desactivar este alumno?')) return
    setDesactivando(true)
    try {
      await deleteAlumno(id)
      navigate('/alumnos')
    } catch {
      alert('Error al desactivar.')
      setDesactivando(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/alumnos')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{alumno.nombre}</h1>
        {alumno.activo ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inactivo
          </span>
        )}
      </div>

      {/* Datos del alumno */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Datos del alumno</h2>
        </div>
        <dl className="divide-y divide-gray-100 px-4">
          <InfoRow label="Email"   value={alumno.email} />
          <InfoRow label="Teléfono" value={alumno.telefono} />
          <InfoRow label="Nivel"   value={NIVEL_LABELS[alumno.nivel] ?? alumno.nivel} />
          <InfoRow label="Curso"   value={CURSO_LABELS[alumno.curso] ?? alumno.curso} />
          <InfoRow label="Tutor"   value={alumno.tutor?.nombre} />
        </dl>
      </div>

      {/* Apoderado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Apoderado</h2>
        </div>
        {alumno.apoderado ? (
          <dl className="divide-y divide-gray-100 px-4">
            <InfoRow label="Nombre"   value={alumno.apoderado.nombre} />
          </dl>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-400 italic">Sin apoderado registrado.</p>
        )}
      </div>

      {/* Acciones (solo admin) */}
      {isAdmin && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/alumnos/${id}/editar`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Editar
          </button>
          {alumno.activo && (
            <button
              onClick={handleDesactivar}
              disabled={desactivando}
              className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {desactivando ? 'Desactivando…' : 'Desactivar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
