# Reglas de inflección para modelos con nombres en español.
# Rails pluraliza en inglés por defecto; aquí definimos los casos irregulares.
ActiveSupport::Inflector.inflections(:en) do |inflect|
  inflect.irregular 'tutor',     'tutores'
  inflect.irregular 'alumno',    'alumnos'
  inflect.irregular 'sesion',    'sesiones'
  inflect.irregular 'materia',   'materias'
  inflect.irregular 'apoderado', 'apoderados'
end
