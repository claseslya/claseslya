class CreateAlumnos < ActiveRecord::Migration[8.1]
  def change
    create_table :alumnos, id: :uuid do |t|
      t.string     :nombre,       null: false
      t.string     :email
      t.string     :telefono
      t.references :tutor,        null: true,  foreign_key: { to_table: :tutores },    type: :uuid
      t.references :apoderado,    null: true,  foreign_key: { to_table: :apoderados }, type: :uuid
      t.integer    :nivel,        null: false
      t.integer    :curso,        null: false
      t.boolean    :activo,       null: false, default: true

      t.timestamps
    end
  end
end
