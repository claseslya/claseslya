import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAlumnos } from '../services/api'
import { CURSO_LABELS } from '../utils/cursos'

export default function AlumnosPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [alumnos, setAlumnos] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlumnos = useCallback(async (q) => {
    setLoading(true)
    setError(null)
    try {
      const params = q ? { search: q } : {}
      const res = await getAlumnos(params)
      setAlumnos(res.data.data)
      setTotal(res.data.meta.total)
    } catch {
      setError('Error al cargar alumnos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchAlumnos(search), 300)
    return () => clearTimeout(timer)
  }, [search, fetchAlumnos])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
        {isAdmin && (
          <button
            onClick={() => navigate('/alumnos/nuevo')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nuevo alumno
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nombre', 'Curso', 'Tutor', 'Estado'].map((h) => (
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
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                  Cargando…
                </td>
              </tr>
            ) : alumnos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                  No se encontraron alumnos.
                </td>
              </tr>
            ) : (
              alumnos.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/alumnos/${a.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {a.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {CURSO_LABELS[a.curso] ?? a.curso}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {a.tutor?.nombre ?? <span className="text-gray-400 italic">Sin tutor</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.activo ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
            {total} alumno{total !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
