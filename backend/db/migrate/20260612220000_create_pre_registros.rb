class CreatePreRegistros < ActiveRecord::Migration[7.1]
  def change
    create_table :pre_registros, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :nombre_contacto, null: false
      t.string :email_contacto, null: false
      t.string :telefono_contacto
      t.references :tutor, type: :uuid, foreign_key: { to_table: :tutores }, null: true
      t.references :materia, type: :uuid, foreign_key: true, null: true
      t.text :mensaje
      t.integer :estado, null: false, default: 0

      t.timestamps
    end

    add_index :pre_registros, :estado
    add_index :pre_registros, :email_contacto
  end
end
