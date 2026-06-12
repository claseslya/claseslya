arthur = Tutor.find_or_create_by!(email: 'arthur@claseslya.cl') do |t|
  t.nombre   = 'Arthur'
  t.password = 'password123'
  t.rol      = :admin
end

laura = Tutor.find_or_create_by!(email: 'laura@claseslya.cl') do |t|
  t.nombre   = 'Laura'
  t.password = 'password123'
  t.rol      = :tutor
end

# Materias
nombres_materias = [ 'Matemáticas', 'Lenguaje', 'Historia', 'Ciencias', 'Programación', 'Guitarra' ]
materias = nombres_materias.each_with_object({}) do |nombre, hash|
  hash[nombre] = Materia.find_or_create_by!(nombre: nombre)
end

# Asignación de materias a tutores (idempotente)
[ 'Matemáticas', 'Lenguaje', 'Historia' ].each do |m|
  arthur.materias << materias[m] unless arthur.materias.include?(materias[m])
end

[ 'Ciencias', 'Programación' ].each do |m|
  laura.materias << materias[m] unless laura.materias.include?(materias[m])
end

# Apoderados de ejemplo
maria = Apoderado.find_or_create_by!(nombre: 'María González') do |a|
  a.email    = 'maria.gonzalez@email.com'
  a.telefono = '+56912345678'
  a.relacion = 'madre'
end

pedro = Apoderado.find_or_create_by!(nombre: 'Pedro Martínez') do |a|
  a.email    = 'pedro.martinez@email.com'
  a.telefono = '+56923456789'
  a.relacion = 'padre'
end

# Alumnos de ejemplo
Alumno.find_or_create_by!(nombre: 'Sofía González') do |al|
  al.email       = 'sofia.g@email.com'
  al.telefono    = '+56934567890'
  al.tutor       = arthur
  al.apoderado   = maria
  al.nivel       = :basica
  al.curso       = 8
end

Alumno.find_or_create_by!(nombre: 'Matías Pérez') do |al|
  al.email       = 'matias.p@email.com'
  al.tutor       = arthur
  al.apoderado   = pedro
  al.nivel       = :media
  al.curso       = 9
end

Alumno.find_or_create_by!(nombre: 'Valentina Rojas') do |al|
  al.email       = 'vale.r@email.com'
  al.tutor       = laura
  al.nivel       = :media
  al.curso       = 11
end

sofia    = Alumno.find_by!(nombre: 'Sofía González')
matias   = Alumno.find_by!(nombre: 'Matías Pérez')
valentina = Alumno.find_by!(nombre: 'Valentina Rojas')
mate     = materias['Matemáticas']
lenguaje = materias['Lenguaje']
ciencias = materias['Ciencias']

unless Sesion.exists?
  Sesion.create!([
    {
      alumno: sofia, tutor: arthur, materia: mate,
      fecha_hora: 2.weeks.ago, duracion_min: 60, estado: :realizada,
      notas: 'Repaso de fracciones y porcentajes.'
    },
    {
      alumno: matias, tutor: arthur, materia: lenguaje,
      fecha_hora: 1.week.ago, duracion_min: 90, estado: :realizada,
      notas: 'Análisis de texto argumentativo.'
    },
    {
      alumno: sofia, tutor: arthur, materia: mate,
      fecha_hora: 3.days.from_now, duracion_min: 60, estado: :agendada,
      notas: nil
    },
    {
      alumno: valentina, tutor: laura, materia: ciencias,
      fecha_hora: 5.days.from_now, duracion_min: 60, estado: :agendada,
      notas: 'Preparar material de célula eucariota.'
    },
    {
      alumno: matias, tutor: arthur, materia: lenguaje,
      fecha_hora: 3.days.ago, duracion_min: 60, estado: :cancelada,
      notas: 'Cancelada por el alumno.'
    }
  ])
end

mes_actual  = Time.current.strftime('%Y-%m')
mes_pasado  = 1.month.ago.strftime('%Y-%m')

unless Pago.exists?
  Pago.create!([
    {
      alumno: sofia, monto: 50_000, periodo: mes_pasado,
      fecha_pago: 1.month.ago.to_date, estado: :pagado, metodo: :transferencia
    },
    {
      alumno: matias, monto: 50_000, periodo: mes_pasado,
      fecha_pago: 1.month.ago.to_date, estado: :pagado, metodo: :efectivo
    },
    {
      alumno: valentina, monto: 50_000, periodo: mes_actual,
      estado: :pendiente
    }
  ])
end
