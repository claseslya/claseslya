class Sesion < ApplicationRecord
  belongs_to :alumno
  belongs_to :tutor
  belongs_to :materia

  enum :estado, { agendada: 0, realizada: 1, cancelada: 2 }

  validates :fecha_hora,   presence: true
  validates :duracion_min, numericality: { greater_than: 0 }

  scope :de_hoy,       -> { where(fecha_hora: Time.current.beginning_of_day..Time.current.end_of_day) }
  scope :de_semana,    -> { where(fecha_hora: Time.current.beginning_of_week..Time.current.end_of_week) }
  scope :del_mes,      -> { where(fecha_hora: Time.current.beginning_of_month..Time.current.end_of_month) }
  scope :por_tutor,    ->(tutor_id) { where(tutor_id: tutor_id) }
  scope :por_alumno,   ->(alumno_id) { where(alumno_id: alumno_id) }
  scope :proximas,     -> { agendada.where('fecha_hora > ?', Time.current) }
end
