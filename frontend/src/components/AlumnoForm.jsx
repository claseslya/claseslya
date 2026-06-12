import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAlumno, createAlumno, updateAlumno, getTutores, getApoderados, createApoderado } from '../services/api'
import { NIVEL_LABELS, CURSOS_POR_NIVEL, CURSO_LABELS } from '../utils/cursos'

const NIVELES = Object.keys(NIVEL_LABELS)

const EMPTY_FORM = {
  nombre: '', email: '', telefono: '',
  nivel: 'basica', curso: '6',
  tutor_id: '', apoderado_id: '',
}

const EMPTY_APODERADO = { nombre: '', email: '', telefono: '', relacion: 'madre' }

export default function AlumnoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [tutores, setTutores] = useState([])
  const [apoderados, setApoderados] = useState([])
  const [nuevoApoderado, setNuevoApoderado] = useState(false)
  const [apoderadoForm, setApoderadoForm] = useState(EMPTY_APODERADO)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const promises = [getTutores(), getApoderados()]
    if (isEdit) promises.push(getAlumno(id))

    Promise.all(promises).then(([tutRes, apoRes, alumnoRes]) => {
      setTutores(tutRes.data.data)
      setApoderados(apoRes.data.data)
      if (alumnoRes) {
        const a = alumnoRes.data.data
        setForm({
          nombre:      a.nombre    ?? '',
          email:       a.email     ?? '',
          telefono:    a.telefono  ?? '',
          nivel:       a.nivel     ?? 'basica',
          curso:       String(a.curso ?? 6),
          tutor_id:    a.tutor?.id     ?? '',
          apoderado_id: a.apoderado?.id ?? '',
        })
      }
    }).catch(() => {
      setErrors({ general: 'Error al cargar datos.' })
    }).finally(() => setLoadingData(false))
  }, [id, isEdit])

  // Cuando cambia el nivel, resetear curso al primero disponible
  function handleNivelChange(e) {
    const nivel = e.target.value
    const primerCurso = String(CURSOS_POR_NIVEL[nivel][0])
    setForm((f) => ({ ...f, nivel, curso: primerCurso }))
  }

  function validate() {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      let apoderado_id = form.apoderado_id

      if (nuevoApoderado) {
        if (!apoderadoForm.nombre.trim()) {
          setErrors({ apoderado_nombre: 'El nombre del apoderado es obligatorio.' })
          setSaving(false)
          return
        }
        const res = await createApoderado(apoderadoForm)
        apoderado_id = res.data.data.id
      }

      const payload = { ...form, curso: Number(form.curso), apoderado_id: apoderado_id || null }

      if (isEdit) {
        await updateAlumno(id, payload)
      } else {
        await createAlumno(payload)
      }
      navigate('/alumnos')
    } catch (err) {
      const msg = err.response?.data?.details?.nombre?.[0]
        ?? err.response?.data?.error
        ?? 'Error al guardar.'
      setErrors({ general: msg })
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>
  }

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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar alumno' : 'Nuevo alumno'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errors.general}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Nivel + Curso */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select
              value={form.nivel}
              onChange={handleNivelChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NIVELES.map((n) => (
                <option key={n} value={n}>{NIVEL_LABELS[n]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
            <select
              value={form.curso}
              onChange={(e) => setForm((f) => ({ ...f, curso: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CURSOS_POR_NIVEL[form.nivel].map((c) => (
                <option key={c} value={String(c)}>{CURSO_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
          <select
            value={form.tutor_id}
            onChange={(e) => setForm((f) => ({ ...f, tutor_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin tutor</option>
            {tutores.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Apoderado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apoderado</label>
          {!nuevoApoderado ? (
            <div className="flex gap-2">
              <select
                value={form.apoderado_id}
                onChange={(e) => setForm((f) => ({ ...f, apoderado_id: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin apoderado</option>
                {apoderados.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNuevoApoderado(true)}
                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
              >
                + Nuevo
              </button>
            </div>
          ) : (
            <div className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50">
              <p className="text-xs font-medium text-blue-700 mb-2">Nuevo apoderado</p>
              <input
                type="text"
                placeholder="Nombre *"
                value={apoderadoForm.nombre}
                onChange={(e) => setApoderadoForm((f) => ({ ...f, nombre: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.apoderado_nombre ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.apoderado_nombre && <p className="text-xs text-red-600">{errors.apoderado_nombre}</p>}
              <input
                type="email"
                placeholder="Email"
                value={apoderadoForm.email}
                onChange={(e) => setApoderadoForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={apoderadoForm.telefono}
                onChange={(e) => setApoderadoForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <select
                value={apoderadoForm.relacion}
                onChange={(e) => setApoderadoForm((f) => ({ ...f, relacion: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="otro">Otro</option>
              </select>
              <button
                type="button"
                onClick={() => { setNuevoApoderado(false); setApoderadoForm(EMPTY_APODERADO) }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear alumno'}
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
