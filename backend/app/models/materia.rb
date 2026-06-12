class Materia < ApplicationRecord
  has_many :tutor_materias
  has_many :tutores, through: :tutor_materias

  validates :nombre, presence: true, uniqueness: true
end
