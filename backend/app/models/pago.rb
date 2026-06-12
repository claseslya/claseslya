class Pago < ApplicationRecord
  belongs_to :alumno

  enum :estado, { pendiente: 0, pagado: 1 }
  enum :metodo, { transferencia: 0, efectivo: 1 }

  validates :monto,   numericality: { greater_than: 0 }
  validates :periodo, format: { with: /\A\d{4}-\d{2}\z/, message: 'debe tener formato YYYY-MM' }

  scope :pendientes,      -> { where(estado: :pendiente) }
  scope :pagados,         -> { where(estado: :pagado) }
  scope :del_periodo,     ->(periodo) { where(periodo: periodo) }
  scope :del_mes_actual,  -> { where(periodo: Time.current.strftime('%Y-%m')) }

  def self.generar_pendientes(periodo, monto:)
    alumnos_sin_pago = Alumno.activos.where.not(
      id: del_periodo(periodo).select(:alumno_id)
    )

    alumnos_sin_pago.map do |alumno|
      create!(alumno: alumno, monto: monto, periodo: periodo, estado: :pendiente)
    end
  end
end
