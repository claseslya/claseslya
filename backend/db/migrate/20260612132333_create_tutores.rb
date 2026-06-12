class CreateTutores < ActiveRecord::Migration[8.1]
  def change
    create_table :tutores, id: :uuid do |t|
      t.string  :nombre,             null: false
      t.string  :email,              null: false
      t.string  :telefono
      t.string  :password_digest,    null: false
      t.integer :rol,                null: false, default: 1
      t.jsonb   :horario_disponible, null: false, default: {}
      t.boolean :activo,             null: false, default: true

      t.timestamps
    end

    add_index :tutores, :email, unique: true
  end
end
