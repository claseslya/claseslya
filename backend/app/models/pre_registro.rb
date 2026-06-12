class PreRegistro < ApplicationRecord
  belongs_to :tutor, optional: true
  belongs_to :materia, optional: true

  enum :estado, { pendiente: 0, contactado: 1, descartado: 2 }

  validates :nombre_contacto, presence: true
  validates :email_contacto, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  scope :pendientes, -> { where(estado: :pendiente) }
  scope :recientes, -> { order(created_at: :desc) }

  def self.rate_limit_exceeded?(email)
    where(email_contacto: email.downcase)
      .where(created_at: 24.hours.ago..)
      .count >= 5
  end
end
