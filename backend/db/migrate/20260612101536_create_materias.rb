class CreateMaterias < ActiveRecord::Migration[8.1]
  def change
    create_table :materias, id: :uuid do |t|
      t.string :nombre, null: false

      t.timestamps
    end

    add_index :materias, :nombre, unique: true
  end
end
