class CreatePagos < ActiveRecord::Migration[7.0]
  def change
    create_table :pagos, id: :uuid do |t|
      t.references :alumno, null: false, foreign_key: true, type: :uuid
      t.integer    :monto,      null: false
      t.date       :fecha_pago
      t.string     :periodo,    null: false
      t.integer    :estado,     null: false, default: 0
      t.integer    :metodo

      t.timestamps
    end

    add_index :pagos, [:alumno_id, :periodo]
  end
end
