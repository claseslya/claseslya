class Alumno < ApplicationRecord
  belongs_to :tutor,     optional: true
  belongs_to :apoderado, optional: true

  enum :nivel, { basica: 0, media: 1 }

  validates :nombre, presence: true
  validates :curso, inclusion: { in: 6..12 }

  scope :activos,     -> { where(activo: true) }
  scope :por_tutor,   ->(tutor_id) { where(tutor_id: tutor_id) }
end
