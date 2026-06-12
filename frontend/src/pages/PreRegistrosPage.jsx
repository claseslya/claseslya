import { useState, useEffect, useCallback, Fragment } from 'react'
import { getPreRegistros, updatePreRegistro } from '../services/api'

const TABS = [
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'contactado', label: 'Contactados' },
  { value: 'descartado', label: 'Descartados' },
]

const ESTADO_BADGE = {
  pendiente:  'bg-yellow-100 text-yellow-800',
  contactado: 'bg-green-100 text-green-800',
  descartado: 'bg-gray-100 text-gray-500',
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function PreRegistrosPage() {
  const [tab, setTab]           = useState('pendiente')
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  const fetchData = useCallback(async (estado) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPreRegistros({ estado })
      setItems(res.data.data)
      setTotal(res.data.meta.total)
    } catch {
      setError('Error al cargar pre-registros.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setExpanded(null)
    fetchData(tab)
  }, [tab, fetchData])

  async function cambiarEstado(id, estado) {
    setUpdating(id)
    try {
      await updatePreRegistro(id, { estado })
      fetchData(tab)
      setExpanded(null)
    } catch {
      setError('Error al actualizar el estado.')
    } finally {
      setUpdating(null)
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-registros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Solicitudes recibidas desde el formulario público
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
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
              {['Fecha', 'Nombre', 'Email', 'Teléfono', 'Tutor solicitado', 'Materia', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No hay pre-registros {tab === 'pendiente' ? 'pendientes' : tab === 'contactado' ? 'contactados' : 'descartados'}.
                </td>
              </tr>
            ) : (
              items.map(pr => (
                <Fragment key={pr.id}>
                  <tr
                    onClick={() => toggleExpand(pr.id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatFecha(pr.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {pr.nombre_contacto}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <a
                        href={`mailto:${pr.email_contacto}`}
                        onClick={e => e.stopPropagation()}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {pr.email_contacto}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {pr.telefono_contacto || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {pr.tutor?.nombre || <span className="text-gray-400">Sin preferencia</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {pr.materia?.nombre || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ESTADO_BADGE[pr.estado]}`}>
                        {pr.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        {pr.estado !== 'contactado' && (
                          <button
                            onClick={() => cambiarEstado(pr.id, 'contactado')}
                            disabled={updating === pr.id}
                            className="text-xs text-green-700 font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
                          >
                            {updating === pr.id ? '…' : 'Marcar contactado'}
                          </button>
                        )}
                        {pr.estado !== 'descartado' && (
                          <button
                            onClick={() => cambiarEstado(pr.id, 'descartado')}
                            disabled={updating === pr.id}
                            className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                          >
                            {updating === pr.id ? '…' : 'Descartar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expanded === pr.id && (
                    <tr className="bg-blue-50/40">
                      <td colSpan={8} className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Mensaje
                        </p>
                        {pr.mensaje
                          ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{pr.mensaje}</p>
                          : <p className="text-sm text-gray-400 italic">Sin mensaje.</p>
                        }
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
            {total} solicitud{total !== 1 ? 'es' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
