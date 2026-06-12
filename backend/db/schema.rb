# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_12_220000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "alumnos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.uuid "apoderado_id"
    t.datetime "created_at", null: false
    t.integer "curso", null: false
    t.string "email"
    t.integer "nivel", null: false
    t.string "nombre", null: false
    t.string "telefono"
    t.uuid "tutor_id"
    t.datetime "updated_at", null: false
    t.index ["apoderado_id"], name: "index_alumnos_on_apoderado_id"
    t.index ["tutor_id"], name: "index_alumnos_on_tutor_id"
  end

  create_table "apoderados", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "nombre", null: false
    t.string "relacion"
    t.string "telefono"
    t.datetime "updated_at", null: false
  end

  create_table "materias", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "nombre", null: false
    t.datetime "updated_at", null: false
    t.index ["nombre"], name: "index_materias_on_nombre", unique: true
  end

  create_table "pagos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "alumno_id", null: false
    t.datetime "created_at", null: false
    t.integer "estado", default: 0, null: false
    t.date "fecha_pago"
    t.integer "metodo"
    t.integer "monto", null: false
    t.string "periodo", null: false
    t.datetime "updated_at", null: false
    t.index ["alumno_id", "periodo"], name: "index_pagos_on_alumno_id_and_periodo"
    t.index ["alumno_id"], name: "index_pagos_on_alumno_id"
  end

  create_table "pre_registros", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email_contacto", null: false
    t.integer "estado", default: 0, null: false
    t.uuid "materia_id"
    t.text "mensaje"
    t.string "nombre_contacto", null: false
    t.string "telefono_contacto"
    t.uuid "tutor_id"
    t.datetime "updated_at", null: false
    t.index ["email_contacto"], name: "index_pre_registros_on_email_contacto"
    t.index ["estado"], name: "index_pre_registros_on_estado"
    t.index ["materia_id"], name: "index_pre_registros_on_materia_id"
    t.index ["tutor_id"], name: "index_pre_registros_on_tutor_id"
  end

  create_table "sesiones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "alumno_id", null: false
    t.datetime "created_at", null: false
    t.integer "duracion_min", default: 60, null: false
    t.integer "estado", default: 0, null: false
    t.datetime "fecha_hora", null: false
    t.uuid "materia_id", null: false
    t.text "notas"
    t.uuid "tutor_id", null: false
    t.datetime "updated_at", null: false
    t.index ["alumno_id"], name: "index_sesiones_on_alumno_id"
    t.index ["materia_id"], name: "index_sesiones_on_materia_id"
    t.index ["tutor_id", "fecha_hora"], name: "index_sesiones_on_tutor_id_and_fecha_hora"
    t.index ["tutor_id"], name: "index_sesiones_on_tutor_id"
  end

  create_table "tutor_materias", id: false, force: :cascade do |t|
    t.uuid "materia_id", null: false
    t.uuid "tutor_id", null: false
    t.index ["materia_id"], name: "index_tutor_materias_on_materia_id"
    t.index ["tutor_id", "materia_id"], name: "index_tutor_materias_on_tutor_id_and_materia_id", unique: true
    t.index ["tutor_id"], name: "index_tutor_materias_on_tutor_id"
  end

  create_table "tutores", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.jsonb "horario_disponible", default: {}, null: false
    t.string "nombre", null: false
    t.string "password_digest", null: false
    t.integer "rol", default: 1, null: false
    t.string "telefono"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_tutores_on_email", unique: true
  end

  add_foreign_key "alumnos", "apoderados"
  add_foreign_key "alumnos", "tutores"
  add_foreign_key "pagos", "alumnos"
  add_foreign_key "pre_registros", "materias"
  add_foreign_key "pre_registros", "tutores"
  add_foreign_key "sesiones", "alumnos"
  add_foreign_key "sesiones", "materias"
  add_foreign_key "sesiones", "tutores"
  add_foreign_key "tutor_materias", "materias"
  add_foreign_key "tutor_materias", "tutores"
end
