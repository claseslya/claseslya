class CreateApoderados < ActiveRecord::Migration[8.1]
  def change
    create_table :apoderados, id: :uuid do |t|
      t.string :nombre,   null: false
      t.string :email
      t.string :telefono
      t.string :relacion

      t.timestamps
    end
  end
end
