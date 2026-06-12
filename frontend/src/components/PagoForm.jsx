import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAlumnos, getPagos, createPago } from '../services/api'
import { periodoActual } from '../utils/formato'

const EMPTY_FORM = {
  alumno_id: '',
  monto:     '',
  periodo:   periodoActual(),
  estado:    'pendiente',
  metodo:    '',
  fecha_pago: '',
}

export default function PagoForm({ onSuccess, onCancel }) {
  const navigate = useNavigate()
  const [form, setForm]         = useState(EMPTY_FORM)
  const [alumnos, setAlumnos]   = useState([])
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    getAlumnos()
      .then((r) => setAlumnos(r.data.data))
      .catch(() => setErrors({ general: 'Error al cargar alumnos.' }))
      .finally(() => setLoadingData(false))
  }, [])

  // Pre-llenar monto con el valor más frecuente del alumno seleccionado
  useEffect(() => {
    if (!form.alumno_id) return
    getPagos({ alumno_id: form.alumno_id })
      .then((r) => {
        const montos = r.data.data.map((p) => p.monto).filter(Boolean)
        if (montos.length === 0) return
        const frecuente = montos
          .reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc }, {})
        const [montoSugerido] = Object.entries(frecuente).sort((a, b) => b[1] - a[1])[0]
        setForm((f) => ({ ...f, monto: montoSugerido }))
      })
      .catch(() => {})
  }, [form.alumno_id])

  function validate() {
    const errs = {}
    if (!form.alumno_id)                     errs.alumno_id = 'Selecciona un alumno.'
    if (!form.monto || Number(form.monto) <= 0) errs.monto = 'El monto debe ser mayor a 0.'
    if (!form.periodo)                       errs.periodo   = 'El periodo es obligatorio.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      await createPago({
        ...form,
        monto: Number(form.monto),
        fecha_pago: form.fecha_pago || null,
        metodo: form.metodo || null,
      })
      onSuccess?.()
      navigate('/pagos')
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Error al guardar.'
      setErrors({ general: msg })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  if (loadingData) return <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => (onCancel ? onCancel() : navigate(-1))}
          className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Volver">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Registrar pago</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errors.general}
          </div>
        )}

        {/* Alumno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alumno <span className="text-red-500">*</span>
          </label>
          <select value={form.alumno_id}
            onChange={(e) => setForm((f) => ({ ...f, alumno_id: e.target.value }))}
            className={inputClass('alumno_id')}>
            <option value="">Seleccionar alumno…</option>
            {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          {errors.alumno_id && <p className="mt-1 text-xs text-red-600">{errors.alumno_id}</p>}
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto (CLP) <span className="text-red-500">*</span>
          </label>
          <input type="number" min="1" value={form.monto}
            onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
            placeholder="50000"
            className={inputClass('monto')} />
          {errors.monto && <p className="mt-1 text-xs text-red-600">{errors.monto}</p>}
        </div>

        {/* Periodo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periodo <span className="text-red-500">*</span>
          </label>
          <input type="month" value={form.periodo}
            onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}
            className={inputClass('periodo')} />
          {errors.periodo && <p className="mt-1 text-xs text-red-600">{errors.periodo}</p>}
        </div>

        {/* Estado y Método */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
            <select value={form.metodo}
              onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin especificar</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
        </div>

        {/* Fecha de pago (solo si pagado) */}
        {form.estado === 'pagado' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
            <input type="date" value={form.fecha_pago}
              onChange={(e) => setForm((f) => ({ ...f, fecha_pago: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando…' : 'Registrar pago'}
          </button>
          <button type="button" onClick={() => (onCancel ? onCancel() : navigate(-1))}
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
