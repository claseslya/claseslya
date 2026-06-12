import { useState } from 'react'

export default function SesionActions({ sesion, onUpdate, onCancel }) {
  const [notas, setNotas] = useState(sesion.notas ?? '')
  const [saving, setSaving] = useState(false)

  async function handleUpdate(nuevoEstado) {
    setSaving(true)
    try {
      await onUpdate(sesion.id, nuevoEstado, notas)
    } finally {
      setSaving(false)
    }
  }

  const esAgendada = sesion.estado === 'agendada'

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Agrega notas sobre esta sesión…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {esAgendada && (
          <>
            <button
              onClick={() => handleUpdate('realizada')}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Marcar realizada'}
            </button>
            <button
              onClick={() => handleUpdate('cancelada')}
              disabled={saving}
              className="bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              Cancelar sesión
            </button>
          </>
        )}
        {!esAgendada && (
          <button
            onClick={() => handleUpdate(sesion.estado)}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar notas'}
          </button>
        )}
        <button
          onClick={onCancel}
          disabled={saving}
          className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
