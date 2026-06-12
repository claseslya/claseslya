import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const BASE_URL = 'http://localhost:3001/api/v1'

const CURSOS = [
  { value: '5b', label: '5° Básico' },
  { value: '6b', label: '6° Básico' },
  { value: '7b', label: '7° Básico' },
  { value: '8b', label: '8° Básico' },
  { value: '1m', label: '1° Medio' },
  { value: '2m', label: '2° Medio' },
  { value: '3m', label: '3° Medio' },
  { value: '4m', label: '4° Medio' },
]

const MATERIAS_DESTACADAS = [
  { nombre: 'Matemáticas', emoji: '📐', desc: 'Álgebra, geometría, cálculo' },
  { nombre: 'Lenguaje', emoji: '📖', desc: 'Comprensión lectora, redacción' },
  { nombre: 'Ciencias', emoji: '🔬', desc: 'Biología, química, física' },
  { nombre: 'Historia', emoji: '🌎', desc: 'Historia, geografía, educación cívica' },
  { nombre: 'Inglés', emoji: '🗣️', desc: 'Conversación, gramática, escritura' },
  { nombre: 'Universitario', emoji: '🎓', desc: 'Cálculo, estadística, física' },
]

const INITIAL_FORM = {
  nombre_contacto: '',
  nombre_estudiante: '',
  email_contacto: '',
  telefono_contacto: '',
  tutor_id: '',
  materia_id: '',
  curso: '',
  mensaje: '',
}

export default function LandingPage() {
  const [tutores, setTutores] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    axios.get(`${BASE_URL}/public/tutores`)
      .then(r => setTutores(r.data.data))
      .catch(() => {})
  }, [])

  const tutorSeleccionado = tutores.find(t => t.id === form.tutor_id)
  const materiasDisponibles = tutorSeleccionado
    ? tutorSeleccionado.materias
    : [...new Map(tutores.flatMap(t => t.materias).map(m => [m.id, m])).values()]

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'tutor_id') next.materia_id = ''
      return next
    })
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.nombre_contacto.trim()) errs.nombre_contacto = 'Requerido'
    if (!form.nombre_estudiante.trim()) errs.nombre_estudiante = 'Requerido'
    if (!form.email_contacto.trim()) errs.email_contacto = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_contacto))
      errs.email_contacto = 'Email inválido'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        nombre_contacto: `${form.nombre_contacto} (est: ${form.nombre_estudiante})`,
        email_contacto: form.email_contacto,
        telefono_contacto: form.telefono_contacto || undefined,
        tutor_id: form.tutor_id || undefined,
        materia_id: form.materia_id || undefined,
        mensaje: [form.curso ? `Curso: ${form.curso}` : '', form.mensaje].filter(Boolean).join('\n') || undefined,
      }
      await axios.post(`${BASE_URL}/pre_registros`, payload)
      setSubmitted(true)
      setForm(INITIAL_FORM)
    } catch (err) {
      const msg = err.response?.data?.error
      if (err.response?.status === 429) {
        setSubmitError('Has enviado demasiadas solicitudes. Intenta nuevamente en 24 horas.')
      } else {
        setSubmitError(msg || 'Error al enviar. Intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-bold text-orange-600">Clases.LyA</span>
          </div>
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium"
          >
            Acceso tutores →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            📍 Concepción, Chile
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Clases particulares en{' '}
            <span className="text-orange-500">Concepción</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Reforzamiento escolar y universitario en matemáticas, lenguaje, ciencias y más.
            Tutores dedicados, resultados reales.
          </p>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
          >
            Agendar clase de prueba
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Materias */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Materias disponibles
          </h2>
          <p className="text-center text-gray-500 mb-10 text-sm">
            Cobertura completa para básica, media y universitario
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MATERIAS_DESTACADAS.map(m => (
              <div
                key={m.nombre}
                className="bg-orange-50 border border-orange-100 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="text-2xl mb-2">{m.emoji}</div>
                <div className="font-semibold text-gray-800 text-sm">{m.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section
        ref={formRef}
        className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50"
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Agenda tu clase de prueba
            </h2>
            <p className="text-gray-500">
              Completa el formulario y te contactamos en menos de 24 horas.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                ¡Solicitud recibida!
              </h3>
              <p className="text-green-700 mb-6">
                Te contactaremos pronto para coordinar tu primera clase.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-green-700 underline hover:text-green-900"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-md border border-orange-100 p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Nombre apoderado/a *"
                  name="nombre_contacto"
                  value={form.nombre_contacto}
                  onChange={handleChange}
                  error={errors.nombre_contacto}
                  placeholder="Tu nombre"
                />
                <Field
                  label="Nombre estudiante *"
                  name="nombre_estudiante"
                  value={form.nombre_estudiante}
                  onChange={handleChange}
                  error={errors.nombre_estudiante}
                  placeholder="Nombre del alumno/a"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Email *"
                  name="email_contacto"
                  type="email"
                  value={form.email_contacto}
                  onChange={handleChange}
                  error={errors.email_contacto}
                  placeholder="tu@correo.cl"
                />
                <Field
                  label="Teléfono"
                  name="telefono_contacto"
                  value={form.telefono_contacto}
                  onChange={handleChange}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tutor preferido
                  </label>
                  <select
                    name="tutor_id"
                    value={form.tutor_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                  >
                    <option value="">Sin preferencia</option>
                    {tutores.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Materia
                  </label>
                  <select
                    name="materia_id"
                    value={form.materia_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                  >
                    <option value="">Seleccionar materia</option>
                    {materiasDisponibles.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Curso del estudiante
                </label>
                <select
                  name="curso"
                  value={form.curso}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar curso</option>
                  {CURSOS.map(c => (
                    <option key={c.value} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mensaje (opcional)
                </label>
                <textarea
                  name="mensaje"
                  value={form.mensaje}
                  onChange={handleChange}
                  rows={3}
                  placeholder="¿Hay algo específico que quieras reforzar? ¿Horarios disponibles?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-base"
              >
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Tus datos son confidenciales y solo se usan para coordinar tus clases.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📚</span>
              <span className="text-white font-bold">Clases.LyA</span>
            </div>
            <p className="text-xs">Tutorías en Concepción, Chile</p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/clases.lya"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-pink-400 transition-colors"
            >
              <InstagramIcon />
              @clases.lya
            </a>
            <a
              href="https://www.tiktok.com/@clases.lya"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-white transition-colors"
            >
              <TikTokIcon />
              @clases.lya
            </a>
          </div>
        </div>
        <div className="text-center text-xs mt-6 text-gray-600">
          © {new Date().getFullYear()} Clases.LyA — Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
    </svg>
  )
}
