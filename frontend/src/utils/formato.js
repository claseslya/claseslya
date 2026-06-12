const clpFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

export function formatCLP(monto) {
  return clpFormatter.format(monto ?? 0)
}

export function periodoActual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function periodoLabel(periodo) {
  if (!periodo) return ''
  const [year, month] = periodo.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
