class CreateSesiones < ActiveRecord::Migration[7.0]
  def change
    create_table :sesiones, id: :uuid do |t|
      t.references :alumno,  null: false, foreign_key: true, type: :uuid
      t.references :tutor,   null: false, foreign_key: true, type: :uuid
      t.references :materia, null: false, foreign_key: true, type: :uuid
      t.datetime   :fecha_hora,   null: false
      t.integer    :duracion_min, null: false, default: 60
      t.integer    :estado,       null: false, default: 0
      t.text       :notas

      t.timestamps
    end

    add_index :sesiones, [:tutor_id, :fecha_hora]
  end
end
