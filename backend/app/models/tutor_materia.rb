class TutorMateria < ApplicationRecord
  self.primary_key = nil

  belongs_to :tutor
  belongs_to :materia
end
