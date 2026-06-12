import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTutores, getAlumnos, createSesion } from '../services/api'

const DURACIONES = [30, 45, 60, 90]

// Devuelve datetime-local string en hora local (evita desfase UTC)
function toLocalDatetimeValue(date) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const EMPTY_FORM = {
  alumno_id:    '',
  tutor_id:     '',
  materia_id:   '',
  fecha_hora:   toLocalDatetimeValue(new Date()),
  duracion_min: '60',
}

export default function SesionForm() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [tutores, setTutores] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([getTutores(), getAlumnos()])
      .then(([tutRes, alumRes]) => {
        const tutoresList = tutRes.data.data
        setTutores(tutoresList)
        setAlumnos(alumRes.data.data)

        // Si es tutor, preseleccionar a sí mismo
        if (!isAdmin) {
          setForm((f) => ({ ...f, tutor_id: user.id }))
        }
      })
      .catch(() => setErrors({ general: 'Error al cargar datos.' }))
      .finally(() => setLoadingData(false))
  }, [isAdmin, user.id])

  // Materias disponibles según el tutor seleccionado
  const materiasDisponibles = useMemo(() => {
    if (!form.tutor_id) return []
    const tutor = tutores.find((t) => t.id === form.tutor_id)
    return tutor?.materias ?? []
  }, [form.tutor_id, tutores])

  // Alumnos filtrados por tutor seleccionado
  const alumnosFiltrados = useMemo(() => {
    if (!form.tutor_id) return alumnos
    return alumnos.filter((a) => a.tutor?.id === form.tutor_id)
  }, [form.tutor_id, alumnos])

  function handleTutorChange(e) {
    setForm((f) => ({ ...f, tutor_id: e.target.value, materia_id: '', alumno_id: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.alumno_id)  errs.alumno_id  = 'Selecciona un alumno.'
    if (!form.tutor_id)   errs.tutor_id   = 'Selecciona un tutor.'
    if (!form.materia_id) errs.materia_id = 'Selecciona una materia.'
    if (!form.fecha_hora) errs.fecha_hora = 'La fecha y hora son obligatorias.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      await createSesion({
        ...form,
        duracion_min: Number(form.duracion_min),
      })
      navigate('/sesiones')
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Error al guardar.'
      setErrors({ general: msg })
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>
  }

  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva sesión</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errors.general}
          </div>
        )}

        {/* Tutor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tutor <span className="text-red-500">*</span>
          </label>
          {isAdmin ? (
            <select
              value={form.tutor_id}
              onChange={handleTutorChange}
              className={inputClass('tutor_id')}
            >
              <option value="">Seleccionar tutor…</option>
              {tutores.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={user.nombre}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          )}
          {errors.tutor_id && <p className="mt-1 text-xs text-red-600">{errors.tutor_id}</p>}
        </div>

        {/* Alumno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alumno <span className="text-red-500">*</span>
          </label>
          <select
            value={form.alumno_id}
            onChange={(e) => setForm((f) => ({ ...f, alumno_id: e.target.value }))}
            className={inputClass('alumno_id')}
          >
            <option value="">Seleccionar alumno…</option>
            {alumnosFiltrados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          {errors.alumno_id && <p className="mt-1 text-xs text-red-600">{errors.alumno_id}</p>}
        </div>

        {/* Materia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Materia <span className="text-red-500">*</span>
          </label>
          <select
            value={form.materia_id}
            onChange={(e) => setForm((f) => ({ ...f, materia_id: e.target.value }))}
            disabled={materiasDisponibles.length === 0}
            className={inputClass('materia_id')}
          >
            <option value="">
              {materiasDisponibles.length === 0
                ? form.tutor_id ? 'Sin materias asignadas' : 'Selecciona un tutor primero'
                : 'Seleccionar materia…'}
            </option>
            {materiasDisponibles.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          {errors.materia_id && <p className="mt-1 text-xs text-red-600">{errors.materia_id}</p>}
        </div>

        {/* Fecha y hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.fecha_hora}
            onChange={(e) => setForm((f) => ({ ...f, fecha_hora: e.target.value }))}
            className={inputClass('fecha_hora')}
          />
          {errors.fecha_hora && <p className="mt-1 text-xs text-red-600">{errors.fecha_hora}</p>}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
          <select
            value={form.duracion_min}
            onChange={(e) => setForm((f) => ({ ...f, duracion_min: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DURACIONES.map((d) => (
              <option key={d} value={String(d)}>{d} minutos</option>
            ))}
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Crear sesión'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
