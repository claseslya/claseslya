class Apoderado < ApplicationRecord
  has_many :alumnos

  validates :nombre, presence: true
end
