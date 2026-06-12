import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPagos, updatePago, generarPendientes } from '../services/api'
import { formatCLP, periodoActual, periodoLabel } from '../utils/formato'

const ESTADO_TABS = [
  { value: '',          label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado',    label: 'Pagados' },
]

const METODO_LABEL = { transferencia: 'Transferencia', efectivo: 'Efectivo' }

const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  pagado:    'bg-green-100 text-green-800',
}

export default function PagosPage() {
  const navigate  = useNavigate()
  const [pagos, setPagos]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [estadoTab, setEstadoTab] = useState('')
  const [periodo, setPeriodo]   = useState(periodoActual())
  const [generando, setGenerando] = useState(false)
  const [montoGenerar, setMontoGenerar] = useState('50000')
  const [showGenerarModal, setShowGenerarModal] = useState(false)
  const [marcandoId, setMarcandoId] = useState(null)

  const fetchPagos = useCallback(async (estado, per) => {
    setLoading(true)
    setError(null)
    try {
      const params = { periodo: per }
      if (estado) params.estado = estado
      const res = await getPagos(params)
      setPagos(res.data.data)
      setTotal(res.data.meta.total)
    } catch {
      setError('Error al cargar pagos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPagos(estadoTab, periodo)
  }, [estadoTab, periodo, fetchPagos])

  // Resumen calculado en el cliente desde los datos cargados
  const resumen = {
    pendiente: pagos.filter((p) => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0),
    pagado:    pagos.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0),
  }

  async function handleMarcarPagado(pago) {
    setMarcandoId(pago.id)
    try {
      await updatePago(pago.id, {
        estado: 'pagado',
        fecha_pago: new Date().toISOString().slice(0, 10),
      })
      fetchPagos(estadoTab, periodo)
    } catch {
      setError('Error al actualizar el pago.')
    } finally {
      setMarcandoId(null)
    }
  }

  async function handleGenerarPendientes() {
    const monto = Number(montoGenerar)
    if (!monto || monto <= 0) return
    setGenerando(true)
    try {
      const res = await generarPendientes({ periodo, monto })
      setShowGenerarModal(false)
      fetchPagos(estadoTab, periodo)
      if (res.data.meta.total === 0) {
        setError('Todos los alumnos ya tienen pago registrado para este periodo.')
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al generar pagos pendientes.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerarModal(true)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Generar pendientes del mes
          </button>
          <button
            onClick={() => navigate('/pagos/nuevo')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Registrar pago
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCLP(resumen.pendiente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Pagado del mes</p>
          <p className="text-2xl font-bold text-green-600">{formatCLP(resumen.pagado)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Periodo:</label>
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">{periodoLabel(periodo)}</span>
        </div>
      </div>

      {/* Tabs estado */}
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
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Alumno', 'Periodo', 'Monto', 'Estado', 'Método', 'Fecha pago', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Cargando…</td></tr>
            ) : pagos.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No hay pagos para este periodo.</td></tr>
            ) : (
              pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {p.alumno.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {p.periodo}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap tabular-nums">
                    {formatCLP(p.monto)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[p.estado]}`}>
                      {p.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {p.metodo ? METODO_LABEL[p.metodo] : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {p.fecha_pago ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {p.estado === 'pendiente' && (
                      <button
                        onClick={() => handleMarcarPagado(p)}
                        disabled={marcandoId === p.id}
                        className="text-xs text-green-700 font-medium hover:underline disabled:opacity-50"
                      >
                        {marcandoId === p.id ? 'Guardando…' : 'Marcar pagado'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            {total} pago{total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal: Generar pendientes */}
      {showGenerarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Generar pagos pendientes</h2>
            <p className="text-sm text-gray-500 mb-4">
              Se creará un pago pendiente para cada alumno activo sin pago en <strong>{periodoLabel(periodo)}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP)</label>
              <input
                type="number"
                min="1"
                value={montoGenerar}
                onChange={(e) => setMontoGenerar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerarPendientes}
                disabled={generando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generando ? 'Generando…' : 'Generar'}
              </button>
              <button
                onClick={() => setShowGenerarModal(false)}
                disabled={generando}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
