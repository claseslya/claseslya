class CreateTutorMaterias < ActiveRecord::Migration[8.1]
  def change
    create_table :tutor_materias, id: false do |t|
      t.references :tutor,   null: false, foreign_key: { to_table: :tutores },  type: :uuid
      t.references :materia, null: false, foreign_key: { to_table: :materias }, type: :uuid
    end

    add_index :tutor_materias, [ :tutor_id, :materia_id ], unique: true
  end
end
