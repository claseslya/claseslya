class Tutor < ApplicationRecord
  has_secure_password

  enum :rol, { admin: 0, tutor: 1 }

  validates :nombre, presence: true
  validates :email,  presence: true,
                     uniqueness: { case_sensitive: false },
                     format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  has_many :alumnos
  has_many :tutor_materias
  has_many :materias, through: :tutor_materias

  scope :activos, -> { where(activo: true) }
end
